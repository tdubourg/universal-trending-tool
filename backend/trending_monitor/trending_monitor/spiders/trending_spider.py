"""
Code based on 
https://github.com/tdubourg/collaborative-personalized-pagerank/blob/master/web_crawler/web_crawler/spiders/WebCrawlerSpider.py
"""

from scrapy.contrib.spiders import Rule
from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor
from scrapy.spider import Spider
# from trending_monitor.items import TrendingMonitorItem
from scrapy.http import Request
from time import time
from slybot.utils import htmlpage_from_response
from scrapely import Scraper, HtmlPage
from scrapy import signals
from scrapy.xlib.pydispatch import dispatcher
import sys

# import re

# deny_links_regexp = re.compile('.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|microsoft\.com|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)', re.IGNORECASE)

def perr(s):
    sys.stderr.write(s)

# Dealing with encoding has been done by others!
import chardet
def decode(s, encodings=('utf8', 'ascii', 'latin1', 'latin9')):
    if type(s) is unicode:
        return s
    for encoding in encodings:
        try:
            return s.decode(encoding)
        except (UnicodeDecodeError):
            pass
    return None

def univ_encode(s):
    if type(s) is unicode:
        return s
    try:
        snew = decode(s)
        if snew is not None:
            s = snew
        else:
            result = chardet.detect(s)
            charenc = result['encoding']
            s = unicode(s, charenc, errors='ignore')
        return s
    except (UnicodeDecodeError):
        return unicode(s, 'utf8', errors='ignore')


class TrendingSpider(Spider):
    name="trending_monitor"
    """docstring for TrendingSpider"""
    start_urls = []
    PRINT_STATS_EVERY_X_CRAWLED_PAGES = 100
    links_rule = None
    urls_seen = set()
    aborted = False
    crawled_all_pages = 0
    score_field_text_negative_matches = []
    def make_requests_from_url(self, url):
        return Request(url, dont_filter=True, meta={'start_url': url, 'metadepth': 0})

    # rules = (
        # Rule(SgmlLinkExtractor(allow=r'.+', deny=(r'.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|microsoft\.com|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)')), follow=False, callback='parse_item'),
    # )

    def __init__(self, db_path, pid):
        print "\n===============================" * 2
        print "Starting TrendingSpider... FOR PID=", pid
        print "\n===============================" * 2
        self.project_id = int(pid)
        self.db_path = db_path
        self.fetch_project_data()
        if self.aborted:
            return
        print "Loaded", len(self.start_urls), "starting urls"
        self.start_time = time()
        self.crawled_pages = 0
        # This has to be set after we run fetch_project_data()
        self.links_rule = Rule(
            SgmlLinkExtractor(
                allow='.+',
                deny=(r'.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)')
            ),
            follow=False,
            callback='parse_item'
        )
        self.links_rule_targeted = Rule(
            SgmlLinkExtractor(
                allow=self.allow_regexp,
                deny=(r'.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)')
            ),
            follow=False,
            callback='parse_item'
        )
        super(TrendingSpider, self).__init__()
        dispatcher.connect(self.spider_closed, signals.spider_closed)

    def spider_closed(self):
        print "Closing spider, crawled", self.crawled_pages
        if self.db is not None:
            self.db.commit()

    def done(self):
        return self.urls_limit is not 0 and (self.crawled_pages > self.urls_limit or self.crawled_all_pages > (self.urls_limit*10))

    def parse(self, response):
        self.crawled_all_pages += 1
        # This condition is there because even if we stopped adding new requests, we might still have more requests 
        # done in total than the self.url_limits
        # why? Because we stop when we reached sefl.urls_limit in terms of _crawled_ urls and not in terms of URLs 
        # added to the queue. This allows us to ensure we always crawl _at least_ self.urls_limit URLs but in return
        # we will most likely always crawl more than self.urls_limit because we will likely add new URLs before some
        # URLs in the queue (the queue having already reached the limit) have been fetched
        if self.done():
            return
        if (self.crawled_pages % self.PRINT_STATS_EVERY_X_CRAWLED_PAGES) is 0:  
            delta = time()-self.start_time
            print "Current crawl speed: ", self.crawled_pages, "urls crawled,", delta, "seconds,", self.crawled_pages / delta, "pages/second"
        if self.links_rule_targeted.link_extractor.matches(response.url):
            print "page targeted", response.url
            self.crawled_pages += 1
            html_p = htmlpage_from_response(response)
            scraped_result = self.scraper.scrape_page(html_p)
            score = scraped_result[0]['score'][0]
            if self.score_field_text_negative_matches:
                for to_strip_off in self.score_field_text_negative_matches:
                    score = score.replace(to_strip_off, '')
            print "\n===============================" * 2
            print "score=", score
            print "\n===============================" * 2
            item = (
                response.url,
                score,
                int(time())
            )
            self.save_to_db(item)
        if self.done(): # wasting a little bit resources here because of ">" instead of ">="
            return  # We do not scrap the links, this time
        unique_new_links = set(
            [
                l for l in self.links_rule.link_extractor.extract_links(response) 
                if len(l.url) <= 255 and TrendingSpider.extract_domain(l.url) == self.our_domain
            ]) - self.urls_seen

        print "Got", len(unique_new_links), "new links"
        self.urls_seen |= unique_new_links
        return [Request(link.url) for link in unique_new_links]

    def save_to_db(self, item):
        self.db.execute('INSERT INTO result(TIMESTAMP, SCORE, PAGE, SEARCH_ID) VALUES(?, ?, ?, ?)',
            (
                item[2],
                item[1],
                item[0],
                self.project_id
            )
        )
        self.db.commit()

    def init_db(self):
        import sqlite3
        self.db = sqlite3.connect(self.db_path)

    def abort(self):
        sys.stderr.write("\n===============================" * 2)
        sys.stderr.write("\nSomething went wrong, aborting.")
        sys.stderr.write("\n===============================" * 2)
        self.start_urls = []
        self.aborted = True

    def fetch_project_data(self):
        self.init_db()
        # Fetch data from DB
        test=str(self.project_id)
        c = self.db.execute('SELECT * FROM search WHERE id=?', (test,))
        d = c.fetchone()
        if d is None:
            perr("No project found in DB")
            return self.abort()
        data_to_match = {'score': d[1]}
        body = d[2]
        url = d[3]
        self.our_domain = TrendingSpider.extract_domain(url)
        self.start_urls = [url]  # This is one of the improvements we could implement
        from scrapely.template import FragmentNotFound
        try:
            self.setup_scraper(body, url, data_to_match)
        except FragmentNotFound:
            perr("Unable to learn from data")
            # We were not able to learn, cancel the crawl by having no start urls
            return self.abort()
        self.allow_regexp = d[5]
        self.urls_limit = int(d[6])
        if d[7] != '' and d[7] is not None:
            self.score_field_text_negative_matches = d[7].split(d[8])
        print "urls_limit=", self.urls_limit

    def setup_scraper(self, body, url, data_to_scrape):
        self.scraper = Scraper()
        decoded_body = univ_encode(body)
        self.scraper.train_from_htmlpage(HtmlPage(url=url, body=decoded_body), data_to_scrape)
    
    @staticmethod
    def extract_domain(url):
        try:
            url = url[url.index("//")+2:] # getting rid of protocol://
        except ValueError:
            # There was no protocol specified
            pass
        try:
            url = url[:url.index("/")] # getting rid of everything after the first "/"
        except ValueError:
            # Maybe it was a domain-onl   y url, with no "/"
            pass
        return url