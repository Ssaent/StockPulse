"""
Stock News Fetcher with Sentiment Analysis
Fetches news from multiple sources
"""

import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

class StockNewsFetcher:
    """Fetch stock news from multiple sources"""

    def __init__(self):
        self.sources = {
            'moneycontrol': 'https://www.moneycontrol.com/rss/marketreports.xml',
            'economictimes': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
            'business_standard': 'https://www.business-standard.com/rss/stock-market-106.rss',
            'livemint': 'https://www.livemint.com/rss/markets'
        }

        # Common name mappings for popular stocks
        self.stock_names = {
            'RELIANCE': ['reliance', 'ril', 'reliance industries'],
            'TCS': ['tcs', 'tata consultancy', 'tata consultancy services'],
            'INFY': ['infosys', 'infy'],
            'HDFCBANK': ['hdfc bank', 'hdfc'],
            'ICICIBANK': ['icici bank', 'icici'],
            'SBIN': ['sbi', 'state bank', 'state bank of india'],
            'BHARTIARTL': ['bharti airtel', 'airtel', 'bharti'],
            'ITC': ['itc', 'itc limited'],
            'WIPRO': ['wipro'],
            'LT': ['larsen', 'larsen & toubro', 'l&t'],
            'MARUTI': ['maruti', 'maruti suzuki'],
            'TATAMOTORS': ['tata motors', 'tata motor'],
            'KOTAKBANK': ['kotak', 'kotak mahindra'],
            'AXISBANK': ['axis bank', 'axis'],
            'HINDUNILVR': ['hindustan unilever', 'hul', 'unilever']
        }

    def get_stock_news(self, symbol, limit=10):
        """Get news for specific stock"""
        all_news = []

        # Get alternative names for the stock
        search_terms = self._get_search_terms(symbol)

        # Fetch from RSS feeds
        for source_name, rss_url in self.sources.items():
            try:
                news = self._fetch_from_rss(rss_url, search_terms, source_name)
                all_news.extend(news)
            except Exception as e:
                print(f"Error fetching from {source_name}: {e}")
                continue

        # If no specific news found, get general market news and filter
        if len(all_news) < 3:
            print(f"Limited news for {symbol}, including general market news...")
            general_news = self.get_market_news(20)

            # Filter for relevance
            for item in general_news:
                if self._is_relevant_to_stock(item, search_terms):
                    all_news.append(item)

        # Sort by date (newest first)
        all_news.sort(key=lambda x: x['published_date'], reverse=True)

        # Add sentiment
        for news_item in all_news:
            news_item['sentiment'] = self._analyze_sentiment(news_item['title'])

        # Remove duplicates based on title
        seen_titles = set()
        unique_news = []
        for item in all_news:
            title_lower = item['title'].lower()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_news.append(item)

        return unique_news[:limit]

    def _get_search_terms(self, symbol):
        """Get all possible search terms for a stock"""
        terms = [symbol.upper(), symbol.lower()]

        # Add known aliases
        if symbol.upper() in self.stock_names:
            terms.extend(self.stock_names[symbol.upper()])

        return terms

    def _is_relevant_to_stock(self, news_item, search_terms):
        """Check if news is relevant to stock"""
        content = f"{news_item['title']} {news_item.get('description', '')}".lower()

        # Check if any search term appears
        for term in search_terms:
            if term.lower() in content:
                return True

        # Check for sector relevance (basic)
        sector_keywords = {
            'BHARTIARTL': ['telecom', 'telco', '5g', 'spectrum', 'mobile', 'airtel'],
            'RELIANCE': ['oil', 'gas', 'jio', 'petrochemical', 'refinery'],
            'TCS': ['it', 'software', 'tech', 'digital'],
            'INFY': ['it', 'software', 'tech', 'digital'],
            'HDFCBANK': ['bank', 'banking', 'loan', 'credit'],
            'ICICIBANK': ['bank', 'banking', 'loan', 'credit'],
            'SBIN': ['bank', 'banking', 'loan', 'credit']
        }

        symbol_upper = search_terms[0] if search_terms else ''
        if symbol_upper in sector_keywords:
            for keyword in sector_keywords[symbol_upper]:
                if keyword in content:
                    return True

        return False

    def get_market_news(self, limit=20):
        """Get general market news"""
        all_news = []

        for source_name, rss_url in self.sources.items():
            try:
                feed = feedparser.parse(rss_url)

                for entry in feed.entries[:15]:
                    news_item = {
                        'title': entry.title,
                        'description': self._clean_description(entry.get('summary', '')[:300]),
                        'url': entry.link,
                        'source': source_name.replace('_', ' ').title(),
                        'published_date': self._parse_date(entry.get('published', '')),
                        'image_url': self._extract_image(entry)
                    }

                    news_item['sentiment'] = self._analyze_sentiment(news_item['title'])
                    all_news.append(news_item)

            except Exception as e:
                print(f"Error fetching market news from {source_name}: {e}")
                continue

        all_news.sort(key=lambda x: x['published_date'], reverse=True)
        return all_news[:limit]

    def _fetch_from_rss(self, rss_url, search_terms, source_name):
        """Fetch news from RSS feed filtered by search terms"""
        news_items = []

        try:
            feed = feedparser.parse(rss_url)

            for entry in feed.entries:
                # Check if any search term mentioned in title or description
                content = f"{entry.title} {entry.get('summary', '')}".lower()

                matched = False
                for term in search_terms:
                    if term.lower() in content:
                        matched = True
                        break

                if matched:
                    news_item = {
                        'title': entry.title,
                        'description': self._clean_description(entry.get('summary', '')[:300]),
                        'url': entry.link,
                        'source': source_name.replace('_', ' ').title(),
                        'published_date': self._parse_date(entry.get('published', '')),
                        'image_url': self._extract_image(entry)
                    }
                    news_items.append(news_item)

        except Exception as e:
            print(f"RSS fetch error: {e}")

        return news_items

    def _clean_description(self, text):
        """Clean HTML and extra content from description"""
        # Remove HTML tags
        soup = BeautifulSoup(text, 'html.parser')
        text = soup.get_text()

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def _analyze_sentiment(self, text):
        """Simple sentiment analysis based on keywords"""
        text = text.lower()

        positive_words = [
            'gain', 'surge', 'rise', 'jump', 'rally', 'up', 'high', 'profit',
            'growth', 'positive', 'bullish', 'strong', 'beat', 'record', 'soar',
            'boost', 'climb', 'advance', 'outperform', 'upgrade', 'buy'
        ]

        negative_words = [
            'fall', 'drop', 'decline', 'loss', 'down', 'crash', 'low', 'weak',
            'negative', 'bearish', 'miss', 'concern', 'plunge', 'tumble', 'sink',
            'slump', 'slide', 'downgrade', 'sell', 'worries', 'fear'
        ]

        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)

        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'

    def _parse_date(self, date_str):
        """Parse date string to datetime"""
        if not date_str:
            return datetime.now()

        try:
            # Try multiple date formats
            formats = [
                '%a, %d %b %Y %H:%M:%S %z',
                '%a, %d %b %Y %H:%M:%S %Z',
                '%Y-%m-%dT%H:%M:%S%z',
                '%Y-%m-%d %H:%M:%S',
                '%d %b %Y %H:%M:%S'
            ]

            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except:
                    continue

            # If all fail, return current time
            return datetime.now()

        except:
            return datetime.now()

    def _extract_image(self, entry):
        """Extract image URL from RSS entry"""
        try:
            # Try media content
            if hasattr(entry, 'media_content') and entry.media_content:
                return entry.media_content[0].get('url', '')

            # Try enclosures
            if hasattr(entry, 'enclosures') and entry.enclosures:
                for enclosure in entry.enclosures:
                    if 'image' in enclosure.get('type', ''):
                        return enclosure.get('href', '')

            # Try parsing from description
            if hasattr(entry, 'summary'):
                soup = BeautifulSoup(entry.summary, 'html.parser')
                img = soup.find('img')
                if img and img.get('src'):
                    return img['src']

        except:
            pass

        return None

    def get_relative_time(self, published_date):
        """Convert datetime to relative time string"""
        now = datetime.now()

        # Remove timezone info for comparison
        if published_date.tzinfo:
            published_date = published_date.replace(tzinfo=None)

        diff = now - published_date

        if diff.days > 0:
            if diff.days == 1:
                return "1 day ago"
            elif diff.days < 7:
                return f"{diff.days} days ago"
            elif diff.days < 30:
                weeks = diff.days // 7
                return f"{weeks} week{'s' if weeks > 1 else ''} ago"
            elif diff.days < 365:
                months = diff.days // 30
                return f"{months} month{'s' if months > 1 else ''} ago"
            else:
                years = diff.days // 365
                return f"{years} year{'s' if years > 1 else ''} ago"

        hours = diff.seconds // 3600
        if hours > 0:
            if hours == 1:
                return "1 hour ago"
            return f"{hours} hours ago"

        minutes = diff.seconds // 60
        if minutes > 0:
            if minutes == 1:
                return "1 minute ago"
            return f"{minutes} minutes ago"

        return "Just now"