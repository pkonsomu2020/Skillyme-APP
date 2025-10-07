import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import testAllConnections from '../test-connections';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
}

export default function ConnectionTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    passed: number;
    failed: number;
    total: number;
    details: TestResult[];
  } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await testAllConnections();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Frontend-Backend Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Connection Tests'
            )}
          </Button>
          
          {results && (
            <div className="flex items-center gap-4">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {results.passed} Passed
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {results.failed} Failed
              </Badge>
              <Badge variant="outline">
                {Math.round((results.passed / results.total) * 100)}% Success
              </Badge>
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            <div className="grid gap-2">
              {results.details.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{test.test}</span>
                  <div className="flex items-center gap-2">
                    {test.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {test.message && (
                      <span className="text-sm text-muted-foreground">{test.message}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Summary:</h4>
            <p className="text-sm text-muted-foreground">
              {results.passed === results.total ? (
                '🎉 All connections are working perfectly! The frontend is fully connected to the backend.'
              ) : results.passed >= results.total * 0.8 ? (
                '⚠️ Most connections are working. A few minor issues may need attention.'
              ) : (
                '❌ Several connection issues detected. Please check the failed tests above.'
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
