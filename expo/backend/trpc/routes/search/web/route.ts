import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

export const webSearchProcedure = publicProcedure
  .input(
    z.object({
      query: z.string(),
      numResults: z.number().optional().default(10),
    })
  )
  .mutation(async ({ input }: { input: { query: string; numResults: number } }) => {
    const { query, numResults } = input;

    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        const fallbackResults = [
          {
            title: `Search results for: ${query}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: 'Click to view search results on Google',
          },
        ];
        return { results: fallbackResults };
      }

      const data = await response.json();
      
      const results = (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || '',
      }));

      return { results };
    } catch (error) {
      console.error('Web search error:', error);
      
      const fallbackResults = [
        {
          title: `Search results for: ${query}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: 'Click to view search results on Google',
        },
      ];
      
      return { results: fallbackResults };
    }
  });
