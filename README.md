Universal Trending Tool
=======================

Tool for Monitoring Trending Pages on Websites

# What works

- Automated web crawling and HTML scraping
- Automated learning using an example HTML page and an example input
- Web UI to input a new "project"
    + A project is the following tuple: 
        * Name
        * Starting URL / example URL
        * Example input / data to scrap
        * Input with the figure to scrap replaced by a unique ID, to filter out the surrounding HTML data
        * A maximum number of pages to be crawled.
- Web UI display of the evolution on a fixed period (cf. TODO) and computation / display of the trending score

# Installation notes / requirements

- SQLite3
- NodeJS
- Node packages:
    + sqite3
    + tmp
    + 
- Python **2.7**
- Python packages:
    + Scrapy >= 0.22.2
    + Scrapely
    + Slybot
    + Chardet

Optional dependency for JS rendering:

- Selenium python package
- jswebkit python package


# TODO

## Very easy / needed

- Take into account the time range input on `chart.html`
- `chart.html` UI improvements

## Easy to relatively-easy to add features

### For normal users

- Normalized output (trend in % of existing trend at the beginning of the period
    * Formula: `delta_value / (delta_time * value_at_start_of_period)` instead of `delta_value / delta_time`)
- Specify a list of URLs instead of a pattern (faster and more efficient and would work on non-linked pages or form-submitted-accessible pages)

### For advanced users

- Allow XPath Expressions
- Allow JS-rendered scraping (using XPaths and on small crawls)

## Additional-work-required features

- Number format parsing options
- Specific formula for "trend" score computation
    + Either a list of pre-constructed formula (if needed a customized one, ask the provider of service)
    + Or directly input by the user
    + In both case, would required to rewrite a little bit the SQL statement for the results, in order to get the full set of scores on the period instead of first and last one (!performance issue, potentially)
- Smart limit of total pages crawled (including non-retained/non-scrapable pages) instead of `10*scrape_pages_limit`
