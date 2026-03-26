// Test script for article search API with permission checks
const testSearch = async () => {
  try {
    console.log('Testing article search API with permission filters...');
    
    // Test basic search (no user - should only show published articles)
    console.log('\n--- Test 1: Anonymous user (should only show published) ---');
    const response = await fetch('http://localhost:5173/api/articles?search=test&limit=5&fields=id,title,slug,excerpt,translations,language,author,authorId');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.articles?.length || 0} articles`);
    
    if (data.articles?.length > 0) {
      data.articles.forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.title} (${article.status || 'unknown status'})`);
        console.log(`     Author: ${article.author?.name || 'Unknown'} (${article.authorId})`);
        console.log(`     Published: ${!!article.publishedAt}`);
      });
    }
    
    // Test with different search terms
    const searchTerms = ['a', 'test', 'article'];
    
    for (const term of searchTerms) {
      console.log(`\n--- Testing search term: "${term}" ---`);
      const termResponse = await fetch(`http://localhost:5173/api/articles?search=${encodeURIComponent(term)}&limit=3`);
      const termData = await termResponse.json();
      console.log(`Found ${termData.articles?.length || 0} articles`);
      
      if (termData.articles?.length > 0) {
        termData.articles.forEach((article, i) => {
          console.log(`  ${i + 1}. ${article.title} (${article.slug})`);
          console.log(`     Status: ${article.status || 'unknown'}`);
          console.log(`     Author: ${article.author?.name || 'Unknown'}`);
        });
      }
    }
    
    console.log('\n--- Test 2: Test with showAll=true (should show all if permissions allow) ---');
    const showAllResponse = await fetch('http://localhost:5173/api/articles?search=test&limit=3&showAll=true');
    const showAllData = await showAllResponse.json();
    console.log(`Found ${showAllData.articles?.length || 0} articles with showAll=true`);
    
  } catch (error) {
    console.error('Search test failed:', error.message);
    console.log('Make sure the dev server is running on localhost:5173');
  }
};

// Run the test
testSearch();
