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


#DOWNLOAD_HANDLERS = {
#    'http': 'trending_monitor.scrapyjs.scrapyjs.dhandler.WebkitDownloadHandler',
#    'https': 'trending_monitor.scrapyjs.scrapyjs.dhandler.WebkitDownloadHandler',
#}

# Crawl responsibly by identifying yourself (and your website) on the user-agent
#USER_AGENT = 'trending_monitor (+http://www.yourdomain.com)'
