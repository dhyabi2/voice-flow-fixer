import React from 'react';
import { VoiceChatInterface } from '@/components/VoiceChat/VoiceChatInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Globe, Zap, Shield, Headphones, MessageSquare } from 'lucide-react';
import heroImage from '@/assets/voice-chat-hero.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Voice Chat AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Experience seamless voice conversations with AI in English and Arabic. 
              Powered by advanced speech recognition and real-time translation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="xl" className="shadow-glow">
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Chat
              </Button>
              <Button variant="outline" size="xl">
                <Globe className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Voice AI Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced technology for natural voice conversations with intelligent translation capabilities
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Mic className="w-8 h-8" />,
                title: "Real-time Voice Recognition",
                description: "Advanced speech-to-text processing with high accuracy for both English and Arabic"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Instant Translation",
                description: "Seamless real-time translation between English and Arabic with structured output"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Lightning Fast",
                description: "Powered by optimized AI models for quick responses and minimal latency"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Privacy Focused",
                description: "Your conversations are processed securely with enterprise-grade protection"
              },
              {
                icon: <Headphones className="w-8 h-8" />,
                title: "Natural Voice Output",
                description: "High-quality text-to-speech with natural-sounding voices in multiple languages"
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Smart Conversations",
                description: "Context-aware AI that maintains natural conversation flow and understands nuance"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Voice Chat Interface */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Try Voice Chat Now
            </h2>
            <p className="text-lg text-muted-foreground">
              Start a conversation and experience the power of AI voice technology
            </p>
          </div>
          
          <VoiceChatInterface className="fade-in" />
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 slide-up">
            <h2 className="text-3xl font-bold mb-4">Technical Specifications</h2>
            <p className="text-lg text-muted-foreground">
              Built with cutting-edge technology for optimal performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Voice Processing</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time speech recognition with Pipecat AI</li>
                <li>• 16kHz audio sampling for optimal quality</li>
                <li>• Advanced noise suppression and echo cancellation</li>
                <li>• Voice activity detection for seamless interaction</li>
                <li>• Support for multiple audio formats</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">AI & Translation</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• OpenRouter LLM integration for intelligent responses</li>
                <li>• Structured output formatting for clear communication</li>
                <li>• Context-aware conversation management</li>
                <li>• High-accuracy English-Arabic translation</li>
                <li>• Customizable response length and tone</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Voice Chat AI
          </h3>
          <p className="text-muted-foreground mb-4">
            Revolutionizing voice communication with AI technology
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Pipecat AI, OpenRouter, and advanced speech processing
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
