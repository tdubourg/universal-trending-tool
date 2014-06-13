#!/usr/bin/python
import sys
from scrapely import Scraper, HtmlPage
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

CLI_ARGS = ["html_file_path", "data_to_match"]
def main():
    if len(sys.argv) < len(CLI_ARGS)+1:
        print "Usage:", sys.argv[0], " ".join(CLI_ARGS)
        exit()
    try:
        with open(sys.argv[1], 'r') as f:
            data_to_match = sys.argv[2]
            body = f.read()
            scraper = Scraper()
            from scrapely.template import FragmentNotFound
            try:
                decoded_body = univ_encode(body)
                scraper.train_from_htmlpage(HtmlPage(body=decoded_body), {'score': data_to_match})
                print 0
            except FragmentNotFound:
                print -1
                return
    except IOError:
        print -2
        return
if __name__ == '__main__':
    main()