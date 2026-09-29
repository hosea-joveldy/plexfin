import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockHero, mockContentRows } from '@/data/mockData';

type ContentRowType = 'continue_watching' | 'trending' | 'new_releases' | 'genre';

const useContent = () => {
  const [featuredContent, setFeaturedContent] = useState(mockHero);
  const [contentRows, setContentRows] = useState(mockContentRows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch featured content
        const { data: featuredData, error: featuredError } = await supabase.rpc('get_featured_content');
        if (featuredError) throw featuredError;
        setFeaturedContent(featuredData);

        // Fetch content rows
        const rowTypes: ContentRowType[] = ['continue_watching', 'trending', 'new_releases', 'genre'];
        const rowPromises = rowTypes.map(type => 
          supabase.rpc('get_content_list', { type })
        );
        const rowData = await Promise.all(rowPromises);
        const rows = rowData.map((result, index) => {
          if (result.error) throw result.error;
          return { type: rowTypes[index], ...result.data };
        });
        setContentRows(rows);
      } catch (err) {
        setError('Failed to fetch content');
        // Fallback to mock data
        setFeaturedContent(mockHero);
        setContentRows(mockContentRows);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return { featuredContent, contentRows, loading, error };
};

export default useContent;