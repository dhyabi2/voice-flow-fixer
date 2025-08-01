import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { debugLogger, LogLevel, LogEntry } from '@/utils/debugLogger';
import { Bug, Download, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function DebugPanel({ isOpen, onToggle, className }: DebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.DEBUG);

  useEffect(() => {
    if (!isOpen) return;

    setLogs(debugLogger.getLogs());
    
    const unsubscribe = debugLogger.onLog((entry) => {
      setLogs(prev => [...prev, entry]);
    });

    return unsubscribe;
  }, [isOpen]);

  const filteredLogs = logs.filter(log => log.level >= filterLevel);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case LogLevel.INFO: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case LogLevel.WARN: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case LogLevel.ERROR: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const exportLogs = () => {
    const data = debugLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-chat-debug-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 w-8 p-0"
        title="Debug Panel"
      >
        <Bug className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                debugLogger.clear();
                setLogs([]);
              }}
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Debug Logs</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter by level:</span>
              {[LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR].map(level => (
                <Button
                  key={level}
                  variant={filterLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLevel(level)}
                  className="h-7 text-xs"
                >
                  {LogLevel[level]}
                </Button>
              ))}
            </div>
            
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No logs to display
                  </p>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(log.level)}>
                          {LogLevel[log.level]}
                        </Badge>
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="font-semibold">{log.category}</span>
                      </div>
                      <div className="ml-4">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                        {log.stackTrace && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-muted-foreground">
                              Stack Trace
                            </summary>
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                              {log.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="network">
            <p className="text-sm text-muted-foreground">Network debugging coming soon...</p>
          </TabsContent>
          
          <TabsContent value="performance">
            <p className="text-sm text-muted-foreground">Performance monitoring coming soon...</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}