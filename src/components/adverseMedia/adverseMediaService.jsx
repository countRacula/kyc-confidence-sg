import { base44 } from '@/api/base44Client';

// Generate search queries based on inputs
export function generateSearchQueries(inputs) {
  const queries = [];
  const { company_name, uen, director_names, locale, keywords, custom_terms } = inputs;

  // Default keywords if none selected
  const defaultKeywords = 'fraud OR scam OR lawsuit OR investigation OR insolvency OR liquidation OR "winding up"';
  const selectedKeywords = keywords.length > 0 
    ? keywords.join(' OR ') 
    : defaultKeywords;

  const localeFilter = locale === 'Singapore' ? ' AND (Singapore OR SG)' : '';

  // Q1: Company + locale + keywords
  queries.push({
    type: 'company',
    query: `"${company_name}"${localeFilter} AND (${selectedKeywords})`
  });

  // Q2: Company + UEN (if provided)
  if (uen) {
    queries.push({
      type: 'company_uen',
      query: `"${company_name}" AND "${uen}"`
    });
  }

  // Q3: Company + Directors (if provided)
  if (director_names) {
    const directors = director_names.split(',').map(d => d.trim()).filter(Boolean);
    directors.forEach(director => {
      queries.push({
        type: 'director',
        query: `"${company_name}" AND "${director}" AND (${selectedKeywords})`
      });
    });
  }

  // Add custom terms if provided
  if (custom_terms) {
    queries.push({
      type: 'custom',
      query: `"${company_name}"${localeFilter} AND (${custom_terms})`
    });
  }

  return queries.slice(0, 3); // Limit to top 3 queries
}

// Calculate date range based on time window
export function getDateRange(timeWindow) {
  const now = new Date();
  const ranges = {
    'last_12_months': new Date(now.setMonth(now.getMonth() - 12)),
    'last_3_years': new Date(now.setFullYear(now.getFullYear() - 3)),
    'all_time': new Date('2000-01-01')
  };
  return ranges[timeWindow] || ranges['last_12_months'];
}

// Fetch from GDELT API
export async function fetchGDELT(query, dateRange) {
  try {
    const startDate = dateRange.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=20&format=json&startdatetime=${startDate}000000`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('GDELT API error');
    
    const data = await response.json();
    return (data.articles || []).map(article => ({
      source: 'GDELT',
      title: article.title || 'Untitled',
      publisher: article.domain || 'Unknown',
      url: article.url || '',
      published_date: article.seendate || new Date().toISOString(),
      snippet: article.socialimage || ''
    }));
  } catch (error) {
    console.error('GDELT fetch error:', error);
    return [];
  }
}

// Fetch from Google News RSS
export async function fetchGoogleNews(query) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-SG&gl=SG&ceid=SG:en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Google News RSS error');
    
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    return Array.from(items).slice(0, 20).map(item => ({
      source: 'Google News',
      title: item.querySelector('title')?.textContent || 'Untitled',
      publisher: item.querySelector('source')?.textContent || 'Unknown',
      url: item.querySelector('link')?.textContent || '',
      published_date: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      snippet: item.querySelector('description')?.textContent || ''
    }));
  } catch (error) {
    console.error('Google News fetch error:', error);
    return [];
  }
}

// Deduplicate results by URL and title similarity
export function deduplicateResults(results) {
  const seen = new Set();
  const unique = [];

  for (const result of results) {
    const key = result.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }

  return unique;
}

// Rank and filter results
export function rankResults(results, locale, limit = 10) {
  return results
    .sort((a, b) => {
      // Prioritize Singapore matches if locale is Singapore
      if (locale === 'Singapore') {
        const aIsSg = (a.title + a.snippet).toLowerCase().includes('singapore');
        const bIsSg = (b.title + b.snippet).toLowerCase().includes('singapore');
        if (aIsSg && !bIsSg) return -1;
        if (!aIsSg && bIsSg) return 1;
      }

      // Then by date (more recent first)
      const aDate = new Date(a.published_date);
      const bDate = new Date(b.published_date);
      
      // Handle invalid dates
      if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
      if (isNaN(aDate.getTime())) return 1;
      if (isNaN(bDate.getTime())) return -1;
      
      return bDate - aDate;
    })
    .slice(0, limit);
}

// AI summarization for each article
export async function summarizeArticle(article) {
  try {
    const prompt = `Analyze this news article and provide:
1. A 1-2 sentence summary focusing on: What happened? Who is involved? 
2. Classification: Is this an allegation, investigation, civil matter, enforcement, or conviction?
3. Severity assessment: Low, Medium, or High risk signal

Article:
Title: ${article.title}
Publisher: ${article.publisher}
Date: ${article.published_date}
Snippet: ${article.snippet}

Respond in JSON format:
{
  "summary": "1-2 sentence summary here",
  "tag": "Allegation|Investigation|Civil dispute|Enforcement|Conviction|Insolvency|Other",
  "severity": "Low|Medium|High"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          tag: { type: "string" },
          severity: { type: "string" }
        }
      }
    });

    return {
      ...article,
      per_article_summary: result.summary,
      tag: result.tag,
      severity: result.severity
    };
  } catch (error) {
    console.error('Article summarization error:', error);
    return {
      ...article,
      per_article_summary: article.snippet || 'Summary unavailable',
      tag: 'Other',
      severity: 'Low'
    };
  }
}

// Generate overall rollup summary
export async function generateRollupSummary(summarizedResults) {
  try {
    const counts = {
      low: summarizedResults.filter(r => r.severity === 'Low').length,
      medium: summarizedResults.filter(r => r.severity === 'Medium').length,
      high: summarizedResults.filter(r => r.severity === 'High').length
    };

    const topResults = summarizedResults.slice(0, 3);
    const validDates = summarizedResults
      .map(r => new Date(r.published_date))
      .filter(d => !isNaN(d.getTime()));
    const mostRecentDate = validDates.length > 0 
      ? new Date(Math.max(...validDates))
      : null;

    const prompt = `Based on these negative press search results, provide a 2-4 sentence overall assessment:

Results summary:
- Total articles found: ${summarizedResults.length}
- High severity: ${counts.high}
- Medium severity: ${counts.medium}
- Low severity: ${counts.low}

Top 3 most relevant articles:
${topResults.map((r, i) => `${i + 1}. ${r.title} (${r.tag}, ${r.severity}): ${r.per_article_summary}`).join('\n')}

Instructions:
- Use language like "reported", "alleged", "according to" - do not state guilt as fact
- Highlight any patterns or repeated themes
- If results are low severity or ambiguous, note that
- Provide an overall signal: None, Informational, Potential Risk, or High Risk

Respond in JSON:
{
  "summary_text": "2-4 sentence assessment here",
  "overall_signal": "None|Informational|Potential Risk|High Risk"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary_text: { type: "string" },
          overall_signal: { type: "string" }
        }
      }
    });

    return {
      summary_text: result.summary_text,
      overall_signal: result.overall_signal,
      most_recent_date: mostRecentDate?.toISOString(),
      counts_by_severity: counts
    };
  } catch (error) {
    console.error('Rollup summary error:', error);
    return {
      summary_text: 'Unable to generate summary at this time.',
      overall_signal: 'Informational',
      most_recent_date: null,
      counts_by_severity: { low: 0, medium: 0, high: 0 }
    };
  }
}

// Main search orchestration using AI-powered web search
export async function performNegativePressSearch(inputs, onProgress) {
  try {
    onProgress?.('Searching Google and news sources...');
    
    const { company_name, uen, director_names, locale } = inputs;
    
    const localeContext = locale === 'Singapore' ? 'Focus on Singapore sources and Singapore-related news.' : '';
    
    const prompt = `Search Google, Google News, and other public sources for negative press or adverse media about this company:

Company Name: ${company_name}
${uen ? `UEN: ${uen}` : ''}
${director_names ? `Directors: ${director_names}` : ''}
${localeContext}

Search for news articles about:
- Fraud, scams, or financial misconduct
- Lawsuits, legal disputes, or investigations
- Insolvency, liquidation, or business failure
- Regulatory enforcement actions
- Criminal charges or convictions
- Customer complaints or scandals
- Any other negative reputation issues

For EACH article found, provide:
{
  "articles": [
    {
      "title": "Article headline",
      "publisher": "News source name",
      "url": "Direct link to article",
      "published_date": "YYYY-MM-DD format",
      "snippet": "Brief excerpt from the article",
      "summary": "1-2 sentence summary of what happened",
      "tag": "Allegation|Investigation|Civil dispute|Enforcement|Conviction|Insolvency|Other",
      "severity": "Low|Medium|High"
    }
  ],
  "overall_summary": "2-4 sentence assessment of all findings",
  "overall_signal": "None|Informational|Potential Risk|High Risk"
}

If no adverse media found, return empty articles array with overall_signal: "None"`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                publisher: { type: "string" },
                url: { type: "string" },
                published_date: { type: "string" },
                snippet: { type: "string" },
                summary: { type: "string" },
                tag: { type: "string" },
                severity: { type: "string" }
              }
            }
          },
          overall_summary: { type: "string" },
          overall_signal: { type: "string" }
        }
      }
    });

    onProgress?.('Processing results...');

    // Transform to match expected format
    const results = result.articles.map(article => ({
      source: 'Web Search',
      title: article.title || 'Untitled',
      publisher: article.publisher || 'Unknown',
      url: article.url || '',
      published_date: article.published_date || new Date().toISOString(),
      snippet: article.snippet || '',
      per_article_summary: article.summary || article.snippet,
      tag: article.tag || 'Other',
      severity: article.severity || 'Low'
    }));

    // Calculate counts
    const counts = {
      low: results.filter(r => r.severity === 'Low').length,
      medium: results.filter(r => r.severity === 'Medium').length,
      high: results.filter(r => r.severity === 'High').length
    };

    const validDates = results
      .map(r => new Date(r.published_date))
      .filter(d => !isNaN(d.getTime()));
    const mostRecentDate = validDates.length > 0 
      ? new Date(Math.max(...validDates))
      : null;

    return {
      results,
      rollup_summary: {
        summary_text: result.overall_summary || 'No adverse media coverage found.',
        overall_signal: result.overall_signal || 'None',
        most_recent_date: mostRecentDate?.toISOString(),
        counts_by_severity: counts
      }
    };
  } catch (error) {
    console.error('Negative press search error:', error);
    throw error;
  }
}