[
    {
        "name": "calculate",
        "description": "Calculates/evaluates the given expression.",
        "args_schema": {
            "properties": {"expression": {"title": "Expression", "type": "string"}},
            "required": ["expression"],
            "title": "calculateArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
    {
        "name": "get_ticker_info",
        "description": "Retrieve stock data including company info, financials, trading metrics and governance data.",
        "args_schema": {
            "properties": {
                "symbol": {
                    "description": "The stock symbol",
                    "title": "Symbol",
                    "type": "string",
                }
            },
            "required": ["symbol"],
            "title": "get_ticker_infoArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
    {
        "name": "get_ticker_news",
        "description": "Fetches recent news articles related to a specific stock symbol with title, content, and source details.",
        "args_schema": {
            "properties": {
                "symbol": {
                    "description": "The stock symbol",
                    "title": "Symbol",
                    "type": "string",
                }
            },
            "required": ["symbol"],
            "title": "get_ticker_newsArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
    {
        "name": "search",
        "description": "Fetches and organizes search results from Yahoo Finance, including stock quotes and news articles.",
        "args_schema": {
            "properties": {
                "query": {
                    "description": "The search query (ticker symbol or company name)",
                    "title": "Query",
                    "type": "string",
                },
                "search_type": {
                    "description": "Type of search results to retrieve",
                    "enum": ["all", "quotes", "news"],
                    "title": "Search Type",
                    "type": "string",
                },
            },
            "required": ["query", "search_type"],
            "title": "searchArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
    {
        "name": "get_top",
        "description": "Get top entities (ETFs, mutual funds, companies, growth companies, or performing companies) in a sector.",
        "args_schema": {
            "properties": {
                "sector": {
                    "description": "The sector to get",
                    "enum": [
                        "basic-materials",
                        "communication-services",
                        "consumer-cyclical",
                        "consumer-defensive",
                        "energy",
                        "financial-services",
                        "healthcare",
                        "industrials",
                        "real-estate",
                        "technology",
                        "utilities",
                    ],
                    "title": "Sector",
                    "type": "string",
                },
                "top_type": {
                    "description": "Type of top companies to retrieve",
                    "enum": [
                        "top_etfs",
                        "top_mutual_funds",
                        "top_companies",
                        "top_growth_companies",
                        "top_performing_companies",
                    ],
                    "title": "Top Type",
                    "type": "string",
                },
                "top_n": {
                    "default": 10,
                    "description": "Number of top entities to retrieve (limit the results)",
                    "title": "Top N",
                    "type": "integer",
                },
            },
            "required": ["sector", "top_type"],
            "title": "get_topArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
    {
        "name": "get_price_history",
        "description": "Fetch historical price data for a given stock symbol over a specified period and interval.",
        "args_schema": {
            "properties": {
                "symbol": {
                    "description": "The stock symbol",
                    "title": "Symbol",
                    "type": "string",
                },
                "period": {
                    "default": "1mo",
                    "description": "Time period to retrieve data for (e.g. '1d', '1mo', '1y')",
                    "enum": [
                        "1d",
                        "5d",
                        "1mo",
                        "3mo",
                        "6mo",
                        "1y",
                        "2y",
                        "5y",
                        "10y",
                        "ytd",
                        "max",
                    ],
                    "title": "Period",
                    "type": "string",
                },
                "interval": {
                    "default": "1d",
                    "description": "Data interval frequency (e.g. '1d', '1h', '1m')",
                    "enum": [
                        "1m",
                        "2m",
                        "5m",
                        "15m",
                        "30m",
                        "60m",
                        "90m",
                        "1h",
                        "1d",
                        "5d",
                        "1wk",
                        "1mo",
                        "3mo",
                    ],
                    "title": "Interval",
                    "type": "string",
                },
            },
            "required": ["symbol"],
            "title": "get_price_historyArguments",
            "type": "object",
        },
        "response_format": "content_and_artifact",
    },
]
