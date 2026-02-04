import { base44 } from '@/api/base44Client';

// Perform sanctions check using AI with web search
export async function performSanctionsCheck(inputs, onProgress) {
  try {
    const { company_name, uen, director_names } = inputs;
    
    onProgress?.('Checking sanctions databases...');
    
    const prompt = `Search public sanctions and watchlist databases for the following entity:

Company Name: ${company_name}
${uen ? `UEN/Registration Number: ${uen}` : ''}
${director_names ? `Directors/Key Persons: ${director_names}` : ''}

Check against:
- UN Consolidated Sanctions List
- OFAC (US Treasury) Sanctions
- EU Sanctions List
- MAS (Monetary Authority of Singapore) Lists
- UK Sanctions List
- INTERPOL notices
- Financial crime watchlists

Provide a thorough search and respond in JSON format:
{
  "findings": [
    {
      "match_type": "Company|Director|UBO|Similar Name",
      "name": "Name that matched",
      "source": "Which list/database",
      "status": "Active|Delisted|Partial Match",
      "details": "Brief description of the listing",
      "url": "Source URL if available"
    }
  ],
  "overall_assessment": "Clear|Potential Match|Confirmed Match",
  "summary": "2-3 sentence summary of findings",
  "recommendation": "Proceed|Further Investigation Required|Do Not Proceed"
}

If no matches found, return empty findings array with overall_assessment: "Clear"`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match_type: { type: "string" },
                name: { type: "string" },
                source: { type: "string" },
                status: { type: "string" },
                details: { type: "string" },
                url: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" },
          summary: { type: "string" },
          recommendation: { type: "string" }
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Sanctions check error:', error);
    throw error;
  }
}