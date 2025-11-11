"""
Dynamic Stock News Fetcher for Indian Markets
Uses real-time search and multiple APIs without hardcoded mappings
"""

import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
import urllib.parse

class StockNewsFetcher:
    """Dynamic news fetcher using real-time search"""

    def __init__(self):
        # RSS feeds organized by category
        self.rss_feeds = {
            'indian_business': [
                'https://www.moneycontrol.com/rss/marketreports.xml',
                'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
                'https://www.business-standard.com/rss/markets-106.rss',
                'https://www.livemint.com/rss/markets',
                'https://www.financialexpress.com/market/feed/',
            ],
            'global_markets': [
                'https://feeds.bloomberg.com/markets/news.rss',
                'https://www.cnbc.com/id/10000664/device/rss/rss.html',
            ]
        }

        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_stock_news(self, symbol, limit=10):
        """
        Dynamically fetch news for any stock symbol
        Uses multiple search strategies
        """
        all_news = []

        print(f"📰 Dynamically fetching news for {symbol}...")

        # Strategy 1: Google News Search (Most Dynamic)
        google_news = self._search_google_news(symbol, 'stock')
        all_news.extend(google_news)
        print(f"  ✓ Google News: {len(google_news)} articles")

        # Strategy 2: Company name search via Yahoo Finance
        company_info = self._get_company_info(symbol)
        if company_info:
            company_news = self._search_google_news(company_info['name'], 'company')
            all_news.extend(company_news)
            print(f"  ✓ Company search: {len(company_news)} articles")

        # Strategy 3: RSS feed filtering
        rss_news = self._search_rss_feeds(symbol, company_info)
        all_news.extend(rss_news)
        print(f"  ✓ RSS feeds: {len(rss_news)} articles")

        # If still not enough, add relevant market news
        if len(all_news) < limit:
            print(f"  ℹ Adding relevant market news...")
            market_news = self.get_market_news(limit * 2)
            relevant = self._filter_relevant_news(market_news, symbol, company_info)
            all_news.extend(relevant)

        return self._process_news(all_news, limit)

    def get_market_news(self, limit=20):
        """
        Dynamically fetch general market news
        Combines Indian and global sources
        """
        all_news = []

        print(f"📰 Fetching market news from dynamic sources...")

        # Fetch from all RSS feeds
        for category, feeds in self.rss_feeds.items():
            for feed_url in feeds:
                try:
                    news = self._fetch_rss(feed_url)
                    filtered = self._filter_market_relevant(news, category)
                    all_news.extend(filtered)
                except Exception as e:
                    print(f"  ⚠ RSS error: {e}")

        # Add Google News for Indian markets
        market_terms = ['NIFTY', 'SENSEX', 'NSE', 'BSE', 'Indian stock market']
        for term in market_terms[:2]:  # Limit to avoid rate limits
            try:
                google_news = self._search_google_news(term, 'market')
                all_news.extend(google_news[:5])
            except:
                pass

        return self._process_news(all_news, limit)

    def _search_google_news(self, query, context=''):
        """
        Dynamic Google News search
        Context: 'stock', 'company', 'market'
        """
        news = []
        try:
            # Build dynamic search query
            if context == 'stock':
                search_query = f"{query} stock NSE BSE India share price"
            elif context == 'company':
                search_query = f"{query} company India business news"
            else:
                search_query = f"{query} India market"

            # URL encode the query
            encoded_query = urllib.parse.quote(search_query)
            url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"

            feed = feedparser.parse(url)

            for entry in feed.entries[:10]:
                try:
                    news.append({
                        'title': self._clean_text(entry.title),
                        'description': self._extract_description(entry),
                        'url': entry.link,
                        'source': self._extract_source(entry),
                        'published_date': self._parse_date(entry),
                        'category': context,
                    })
                except Exception as e:
                    continue

        except Exception as e:
            print(f"  ⚠ Google News search error: {e}")

        return news

    def _get_company_info(self, symbol):
        """
        Dynamically get company information
        Returns company name, sector, etc.
        """
        try:
            import yfinance as yf

            # Try with .NS (NSE) suffix
            ticker = yf.Ticker(f"{symbol}.NS")
            info = ticker.info

            if info and 'longName' in info:
                return {
                    'name': info.get('longName', symbol),
                    'sector': info.get('sector', ''),
                    'industry': info.get('industry', ''),
                }

            # Fallback: try .BO (BSE)
            ticker = yf.Ticker(f"{symbol}.BO")
            info = ticker.info

            if info and 'longName' in info:
                return {
                    'name': info.get('longName', symbol),
                    'sector': info.get('sector', ''),
                    'industry': info.get('industry', ''),
                }

        except Exception as e:
            print(f"  ℹ Company info fetch failed: {e}")

        return None

    def _search_rss_feeds(self, symbol, company_info):
        """
        Dynamically search RSS feeds for symbol/company mentions
        """
        news = []
        search_terms = self._build_search_terms(symbol, company_info)

        for category, feeds in self.rss_feeds.items():
            for feed_url in feeds:
                try:
                    feed_news = self._fetch_rss(feed_url)

                    # Filter by search terms
                    for item in feed_news:
                        if self._matches_search_terms(item, search_terms):
                            news.append(item)

                except Exception as e:
                    continue

        return news

    def _build_search_terms(self, symbol, company_info):
        """
        Dynamically build search terms from symbol and company info
        """
        terms = [symbol.upper(), symbol.lower()]

        if company_info:
            # Add company name
            name = company_info['name']
            terms.append(name.lower())

            # Add individual words from company name (min 3 chars)
            words = [w for w in name.split() if len(w) > 3]
            terms.extend([w.lower() for w in words])

            # Add sector/industry keywords
            if company_info.get('sector'):
                terms.append(company_info['sector'].lower())
            if company_info.get('industry'):
                terms.append(company_info['industry'].lower())

        return list(set(terms))  # Remove duplicates

    def _matches_search_terms(self, news_item, search_terms):
        """Check if news matches any search term"""
        content = f"{news_item['title']} {news_item.get('description', '')}".lower()

        # Match if any search term appears
        for term in search_terms:
            if len(term) > 2 and term in content:
                return True

        return False

    def _filter_relevant_news(self, news_list, symbol, company_info):
        """
        Dynamically filter news for relevance to stock
        Uses intelligent matching
        """
        search_terms = self._build_search_terms(symbol, company_info)
        relevant = []

        for item in news_list:
            if self._matches_search_terms(item, search_terms):
                relevant.append(item)
            elif self._is_sector_relevant(item, company_info):
                relevant.append(item)

        return relevant

    def _is_sector_relevant(self, news_item, company_info):
        """
        Check if news is relevant to company's sector
        Dynamic sector matching
        """
        if not company_info or not company_info.get('sector'):
            return False

        content = f"{news_item['title']} {news_item.get('description', '')}".lower()
        sector = company_info['sector'].lower()

        # Check for sector mention
        return sector in content

    def _filter_market_relevant(self, news_list, category):
        """
        Filter news for market relevance based on category
        """
        if category == 'global_markets':
            # Only include if mentions India or major impact keywords
            impact_keywords = ['india', 'asia', 'emerging', 'fed', 'interest rate',
                             'crude oil', 'gold', 'dollar', 'china', 'global']

            filtered = []
            for item in news_list:
                content = f"{item['title']} {item.get('description', '')}".lower()
                if any(kw in content for kw in impact_keywords):
                    filtered.append(item)
            return filtered

        return news_list

    def _fetch_rss(self, feed_url):
        """Fetch and parse RSS feed"""
        news = []
        try:
            feed = feedparser.parse(feed_url)

            for entry in feed.entries[:15]:
                try:
                    news.append({
                        'title': self._clean_text(entry.title),
                        'description': self._extract_description(entry),
                        'url': entry.link,
                        'source': self._extract_source_from_url(feed_url),
                        'published_date': self._parse_date(entry),
                        'image_url': self._extract_image(entry),
                    })
                except:
                    continue

        except Exception as e:
            print(f"  ⚠ RSS fetch error: {e}")

        return news

    def _extract_description(self, entry):
        """Extract and clean description from entry"""
        desc = entry.get('summary', entry.get('description', entry.get('title', '')))
        return self._clean_text(desc)[:350]

    def _extract_source(self, entry):
        """Extract source from Google News entry"""
        try:
            if hasattr(entry, 'source') and hasattr(entry.source, 'title'):
                return entry.source.title
        except:
            pass
        return 'News Source'

    def _extract_source_from_url(self, url):
        """Extract readable source name from RSS URL"""
        domain_map = {
            'moneycontrol': 'MoneyControl',
            'economictimes': 'Economic Times',
            'business-standard': 'Business Standard',
            'livemint': 'Mint',
            'financialexpress': 'Financial Express',
            'bloomberg': 'Bloomberg',
            'cnbc': 'CNBC',
            'reuters': 'Reuters',
        }

        url_lower = url.lower()
        for key, name in domain_map.items():
            if key in url_lower:
                return name

        return 'Business News'

    def _parse_date(self, entry):
        """Parse date from entry"""
        date_str = entry.get('published', entry.get('updated', ''))

        if not date_str:
            return datetime.now() - timedelta(hours=2)

        try:
            # Try parsing with feedparser
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                return datetime(*entry.published_parsed[:6])
            if hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                return datetime(*entry.updated_parsed[:6])
        except:
            pass

        # Fallback to recent time
        return datetime.now() - timedelta(hours=2)

    def _extract_image(self, entry):
        """Extract image from entry"""
        try:
            # Media content
            if hasattr(entry, 'media_content') and entry.media_content:
                return entry.media_content[0].get('url')

            # Media thumbnail
            if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
                return entry.media_thumbnail[0].get('url')

            # Parse from description
            if hasattr(entry, 'summary'):
                soup = BeautifulSoup(entry.summary, 'html.parser')
                img = soup.find('img')
                if img and img.get('src'):
                    return img['src']
        except:
            pass

        return None

    def _clean_text(self, text):
        """Clean HTML and extra content"""
        if not text:
            return ""

        # Remove HTML
        soup = BeautifulSoup(text, 'html.parser')
        text = soup.get_text()

        # Clean whitespace
        text = ' '.join(text.split())

        # Remove unwanted patterns
        text = re.sub(r'Read more.*$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Click here.*$', '', text, flags=re.IGNORECASE)

        return text.strip()

    def _process_news(self, news_list, limit):
        """
        Process news: remove duplicates, add sentiment, sort
        """
        # Remove duplicates
        seen = set()
        unique = []

        for item in news_list:
            # Create unique key from first 50 chars of title
            key = item['title'][:50].lower().strip()

            if key not in seen:
                seen.add(key)

                # Add sentiment
                item['sentiment'] = self._analyze_sentiment(item['title'])

                unique.append(item)

        # Sort by date (newest first)
        unique.sort(key=lambda x: x['published_date'], reverse=True)

        return unique[:limit]

    def _analyze_sentiment(self, text):
        """Simple dynamic sentiment analysis"""
        text = text.lower()

        # Positive indicators
        positive = ['gain', 'surge', 'rise', 'jump', 'rally', 'high', 'profit',
                   'growth', 'bullish', 'strong', 'beat', 'soar', 'boost', 'upgrade']

        # Negative indicators
        negative = ['fall', 'drop', 'decline', 'loss', 'crash', 'weak', 'bearish',
                   'miss', 'plunge', 'sink', 'slump', 'downgrade', 'concern', 'worry']

        pos_count = sum(1 for word in positive if word in text)
        neg_count = sum(1 for word in negative if word in text)

        if pos_count > neg_count:
            return 'positive'
        elif neg_count > pos_count:
            return 'negative'
        return 'neutral'

    def get_relative_time(self, published_date):
        """Convert datetime to relative time"""
        if not isinstance(published_date, datetime):
            return "Recently"

        now = datetime.now()
        if published_date.tzinfo:
            published_date = published_date.replace(tzinfo=None)

        diff = now - published_date

        if diff.days > 365:
            return f"{diff.days // 365} year{'s' if diff.days > 365 else ''} ago"
        elif diff.days > 30:
            return f"{diff.days // 30} month{'s' if diff.days > 60 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hour{'s' if diff.seconds > 7200 else ''} ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minute{'s' if diff.seconds > 120 else ''} ago"
        return "Just now"