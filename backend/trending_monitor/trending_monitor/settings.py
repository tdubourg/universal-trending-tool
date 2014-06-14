# Scrapy settings for trending_monitor project
#
# For simplicity, this file contains only the most important settings by
# default. All the other settings are documented here:
#
#     http://doc.scrapy.org/en/latest/topics/settings.html
#

BOT_NAME = 'trending_monitor'

SPIDER_MODULES = ['trending_monitor.spiders']
NEWSPIDER_MODULE = 'trending_monitor.spiders'


# Crawl responsibly by identifying yourself (and your website) on the user-agent
# USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:29.0) Gecko/20100101 Firefox/28.0'
USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

CONCURRENT_REQUESTS = 500  # More than that will be CPU bound anyway...
# CONCURRENT_REQUESTS_PER_DOMAIN = 8
# DOWNLOAD_DELAY = 1
COOKIES_ENABLED = False
RETRY_ENABLED = False
DOWNLOAD_TIMEOUT = 60
AJAXCRAWL_ENABLED = True
MEMUSAGE_REPORT = True
ROBOTSTXT_OBEY = True

from scrapy.log import CRITICAL
LOG_LEVEL=CRITICAL

DEFAULT_REQUEST_HEADERS = {
    "Accept-Language": "en-US,en;q=0.5",
}
