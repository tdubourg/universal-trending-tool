"""
Code based on 
https://github.com/tdubourg/collaborative-personalized-pagerank/blob/master/web_crawler/web_crawler/spiders/WebCrawlerSpider.py
"""

from scrapy.contrib.spiders import Rule
from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor
from scrapy.spider import Spider
from trending_monitor.items import TrendingMonitorItem
from scrapy.http import Request
from time import time
from slybot.utils import htmlpage_from_response
from scrapely import Scraper, HtmlPage

# import re

# deny_links_regexp = re.compile('.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|microsoft\.com|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)', re.IGNORECASE)

# Dealing with encoding has been done by others!
import chardet
def decode(s, encodings=('utf8', 'ascii', 'latin1', 'latin9')):
    for encoding in encodings:
        try:
            print "trying", encoding
            return s.decode(encoding)
        except UnicodeDecodeError:
            pass
    return None

def univ_encode(s):
    try:
        snew = decode(s)
        if snew is not None:
            print "hey"
            s = snew
        else:
            print "ho"
            result = chardet.detect(s)
            charenc = result['encoding']
            s = unicode(s, charenc, errors='ignore')
        return s
    except UnicodeDecodeError:
        print "hu"
        return unicode(s, 'utf8', errors='ignore')


class TrendingSpider(Spider):
    name="trending_monitor"
    """docstring for TrendingSpider"""
    start_urls = []
    X_FIRST_LINKS_TO_FOLLOW_SAME_DOMAIN = 3  # We only follow the X first links of every page for same domain
    X_FIRST_LINKS_TO_FOLLOW_OTHER_DOMAINS = 7  # We only follow the X first links of every page for different domains
    PRINT_STATS_EVERY_X_CRAWLED_PAGES = 100
    links_rule = None
    urls_seen = set()
    def make_requests_from_url(self, url):
        return Request(url, dont_filter=True, meta={'start_url': url, 'metadepth': 0})

    # rules = (
        # Rule(SgmlLinkExtractor(allow=r'.+', deny=(r'.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|microsoft\.com|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)')), follow=False, callback='parse_item'),
    # )

    def __init__(self, pid):
        print "Starting TrendingSpider..."
        self.project_id = int(pid)
        self.fetch_project_data()
        print "Loaded", len(self.start_urls), "starting urls"
        self.start_time = time()
        self.crawled_pages = 0
        # This has to be set after we run fetch_project_data()
        self.links_rule = Rule(
            SgmlLinkExtractor(
                allow=self.allow_regexp,
                deny=(r'.*(spampoison.*|cgi\/.*|accounts\.google\.com|login.*|\.(js|css|png|jpe?g|gif|bmp|tiff)(\?.*)?)')
            ),
            follow=False,
            callback='parse_item'
        )
        super(TrendingSpider, self).__init__()

    def parse(self, response):
        self.crawled_pages += 1
        # This condition is there because even if we stopped adding new requests, we might still have more requests 
        # done in total than the self.url_limits
        # why? Because we stop when we reached sefl.urls_limit in terms of _crawled_ urls and not in terms of URLs 
        # added to the queue. This allows us to ensure we always crawl _at least_ self.urls_limit URLs but in return
        # we will most likely always crawl more than self.urls_limit because we will likely add new URLs before some
        # URLs in the queue (the queue having already reached the limit) have been fetched
        if self.crawled_pages > self.urls_limit:
            return
        if (self.crawled_pages % self.PRINT_STATS_EVERY_X_CRAWLED_PAGES) is 0:  
            print "\n", response.url, "-> We are currently at depth=", str(response.meta['metadepth']), "of start_url=", response.meta['start_url']
            delta = time()-self.start_time
            print "Current crawl speed: ", self.crawled_pages, "urls crawled,", delta, "seconds,", self.crawled_pages / delta, "pages/second"
        item = TrendingMonitorItem()
        html_p = htmlpage_from_response(response)
        scraped_result = self.scraper.scrape_page(html_p)
        print "\n===============================" * 2
        print scraped_result
        print "\n===============================" * 2
        item['url'] = response.url
        item['score'] = scraped_result[0]['score'][0]
        item['time'] = time()
        if self.crawled_pages >= self.urls_limit:
            return  # We do not scrap the links, this time
        unique_new_links = set(
            [
                l for l in self.links_rule.link_extractor.extract_links(response) 
                if len(l.url) <= 255 and l.nofollow is False
            ]) - self.urls_seen

        print "Got", len(unique_new_links), "new links"
        self.urls_seen |= unique_new_links
        return [Request(link.url) for link in unique_new_links]

    def init_db(self):
        pass

    def fetch_project_data(self):
        self.init_db()
        # Fetch data from DB
        body = open("/tmp/learn.html").read()
        url = "https://www.youtube.com/watch?v=Qj48qHM1MXE"
        self.start_urls = [url]  # This is one of the improvements we could implement
        data_to_scrape = {'score': "3.137.359"}
        self.urls_limit = 3
        from scrapely.template import FragmentNotFound
        try:
            self.setup_scraper(body, url, data_to_scrape)
        except FragmentNotFound:
            # We were not able to learn, cancel the crawl by having no start urls
            self.start_urls = []
        self.allow_regexp = r'.+youtube\.com\/watch.+'

    def setup_scraper(self, body, url, data_to_scrape):
        self.scraper = Scraper()
        decoded_body = univ_encode(body)
        print type(decoded_body)
        self.scraper.train_from_htmlpage(HtmlPage(url=url, body=decoded_body), data_to_scrape)
