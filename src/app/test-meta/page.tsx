'use client';

export default function TestMetaPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Social Media Thumbnail Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Open Graph Preview</h2>
            <div className="bg-white rounded-lg overflow-hidden">
              <img 
                src="/images/logo/Dark_Logomark_200_200.png" 
                alt="Open Graph Preview" 
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-black">
                <h3 className="font-bold text-lg">Lucidly Finance - Advanced Yield Platform</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance.
                </p>
                <p className="text-blue-600 text-xs mt-2">dev.lucidly.finance</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Twitter Card Preview</h2>
            <div className="bg-white rounded-lg overflow-hidden">
              <img 
                src="/images/logo/Dark_Logomark_200_200.png" 
                alt="Twitter Card Preview" 
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-black">
                <h3 className="font-bold text-lg">Lucidly Finance - Advanced Yield Platform</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance.
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-blue-600 text-xs">dev.lucidly.finance</span>
                  <span className="text-gray-400 text-xs ml-2">@LucidlyFinance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Meta Tags Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> Lucidly Finance - Advanced Yield Platform</p>
            <p><strong>Description:</strong> Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance.</p>
            <p><strong>Image:</strong> /images/logo/Dark_Logomark_1024_1024.png (1024x1024)</p>
            <p><strong>URL:</strong> https://dev.lucidly.finance</p>
            <p><strong>Twitter Card:</strong> summary_large_image</p>
            <p><strong>Twitter Creator:</strong> @LucidlyFinance</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Image Files Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Primary Thumbnail (PNG)</h3>
              <img 
                src="/images/logo/Dark_Logomark_200_200.png" 
                alt="Meta Image PNG" 
                className="w-full h-32 object-contain bg-gray-700 rounded"
              />
              <p className="text-sm mt-2">Path: /images/logo/Dark_Logomark_200_200.png</p>
              <p className="text-sm text-green-400">✓ PNG file is being used for social media thumbnails</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Alternative Logo (PNG)</h3>
              <img 
                src="/images/logo/Logomark_200_200.png" 
                alt="Alternative Logo PNG" 
                className="w-full h-32 object-contain bg-gray-700 rounded"
              />
              <p className="text-sm mt-2">Path: /images/logo/Logomark_200_200.png</p>
              <p className="text-sm text-blue-400">ℹ Alternative logo option</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-900 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Testing Tools</h2>
          <div className="space-y-4">
            <p>Use these tools to test your social media thumbnails:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100">Facebook Sharing Debugger</a></li>
              <li><a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100">Twitter Card Validator</a></li>
              <li><a href="https://www.opengraph.xyz/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100">OpenGraph.xyz</a></li>
              <li><a href="https://metatags.io/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100">Meta Tags Generator</a></li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-800 rounded">
              <h3 className="text-lg font-semibold mb-2">Local Testing URLs:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Test with:</strong></p>
                <code className="bg-blue-950 px-2 py-1 rounded">http://localhost:3000</code><br/>
                <code className="bg-blue-950 px-2 py-1 rounded">http://localhost:3000/test-meta</code>
              </div>
              
              <div className="mt-4 p-4 bg-green-800 rounded">
                <h3 className="text-lg font-semibold mb-2">✅ Validation Checklist:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    <span>Images display in preview sections</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    <span>Meta tags found in page source</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    <span>Image files load in Network tab</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    <span>No broken image icons</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-300 mr-2">✓</span>
                    <span>Correct titles and descriptions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
