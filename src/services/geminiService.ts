import { GoogleGenAI, Type } from '@google/genai';
import { Category, ListingData, TripDetails } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractListingData(
  input: string,
  categories: Category[],
  tripDetails: TripDetails
): Promise<{ requestedData: Record<string, any>, discovered: Array<{id: string, label: string, type: string, value: any}> }> {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  categories.forEach((cat) => {
    properties[cat.id] = {
      type: Type.STRING,
      description: `Extract the ${cat.label} from the listing. If it's a price, return just the number. If not found, return "Not specified" or "false" or "0".`,
    };
    required.push(cat.id);
  });

  const prompt = `
    You are an expert data extractor. Given the following scraped Airbnb listing data: 
    
    --- START OF SCRAPED DATA ---
    ${input}
    --- END OF SCRAPED DATA ---
    
    Extract the requested information to populate a comparison table.
    
    Trip Details (use this context to answer questions like "Comfort for group size" or "Drive time from origin"):
    - Number of people: ${tripDetails.numPeople}
    - Purpose: ${tripDetails.purpose}
    - Priorities: ${tripDetails.priorities}
    - Travel Method: ${tripDetails.travelMethod}
    - Origin: ${tripDetails.origin}
    
    Please extract the data accurately. If a value is not explicitly stated, use your best judgment based on the listing description, or return a sensible default (e.g., false for boolean features not mentioned, or "Not specified" for strings).
    Ensure you return a JSON object with the exact keys specified in the schema.
  `;

  try {
    const config: any = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          requestedData: {
            type: Type.OBJECT,
            properties,
            required,
          },
          discoveredCategories: {
            type: Type.ARRAY,
            description: "Identify 2-4 other interesting, unique, or highly relevant features, amenities, or rules discovered in the listing that weren't explicitly requested but would be useful for comparison (e.g., 'has_pool', 'pet_fee', 'strict_cancellation').",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A snake_case identifier for the category" },
                label: { type: Type.STRING, description: "A human-readable label for the category" },
                type: { type: Type.STRING, description: "The data type: 'string', 'number', 'boolean', or 'price'" },
                value: { type: Type.STRING, description: "The extracted value (represented as a string)" }
              },
              required: ["id", "label", "type", "value"]
            }
          }
        },
        required: ["requestedData", "discoveredCategories"]
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config,
    });

    const text = response.text;
    console.log("Raw Gemini response:", text);
    
    if (text) {
      const parsed = JSON.parse(text);
      const discoveredArray = Array.isArray(parsed.discoveredCategories) ? parsed.discoveredCategories : [];
      const discovered = discoveredArray.map((c: any) => {
        let val = c.value;
        if (c.type === 'number' || c.type === 'price') {
          const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(num)) val = num;
        } else if (c.type === 'boolean') {
          const strVal = String(val).toLowerCase();
          val = strVal === 'true' || strVal === 'yes' || strVal === '1';
        }
        return { ...c, value: val };
      });
      
      // Handle case where model returns data at the root level instead of inside requestedData
      let requestedData = parsed.requestedData;
      if (!requestedData) {
        if (Array.isArray(parsed) && parsed.length > 0) {
          requestedData = parsed[0];
        } else {
          // If requestedData is missing, assume the root object contains the requested data
          const { discoveredCategories, ...rest } = parsed;
          requestedData = rest;
        }
      } else if (Array.isArray(requestedData) && requestedData.length > 0) {
        // If requestedData is an array, take the first element
        requestedData = requestedData[0];
      }
      
      // Parse requestedData values based on category types
      const parsedRequestedData: Record<string, any> = {};
      if (requestedData) {
        categories.forEach(cat => {
          let val = requestedData[cat.id];
          if (val !== undefined && val !== null) {
            if (cat.type === 'number' || cat.type === 'price') {
              const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
              parsedRequestedData[cat.id] = !isNaN(num) ? num : val;
            } else if (cat.type === 'boolean') {
              const strVal = String(val).toLowerCase();
              parsedRequestedData[cat.id] = strVal === 'true' || strVal === 'yes' || strVal === '1';
            } else {
              parsedRequestedData[cat.id] = val;
            }
          }
        });
      }
      
      return {
        requestedData: parsedRequestedData,
        discovered
      };
    }
    throw new Error('No text returned from Gemini');
  } catch (error) {
    console.error('Error extracting listing data:', error);
    throw error;
  }
}

export async function generateRecommendation(
  listings: { input: string; data: Record<string, any> }[],
  tripDetails: TripDetails,
  categories: Category[]
): Promise<string> {
  const prompt = `
    You are an expert travel agent helping a group decide between several Airbnb listings.
    
    Trip Details:
    - Number of people: ${tripDetails.numPeople}
    - Purpose: ${tripDetails.purpose}
    - Priorities: ${tripDetails.priorities}
    - Travel Method: ${tripDetails.travelMethod}
    - Origin: ${tripDetails.origin}
    
    Here is the data for the listings they are comparing:
    ${JSON.stringify(
      listings.map((l, i) => ({
        listingNumber: i + 1,
        source: l.input.length > 100 ? 'Raw Text Provided' : l.input,
        data: l.data,
      })),
      null,
      2
    )}
    
    Please provide a detailed recommendation on which Airbnb they should choose and why. Compare the options based on their specific trip details and priorities. Be objective and highlight the pros and cons of each option relative to their needs.
    Format your response in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });

    return response.text || 'No recommendation could be generated.';
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
}
