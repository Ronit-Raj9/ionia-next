"use client";

import React from 'react';
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveFlex, 
  ResponsiveStack, 
  ResponsiveSection 
} from '../layout/ResponsiveContainer';
import { useResponsive, useBreakpoint } from '../../hooks/useResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Example component demonstrating mobile-first responsive design
 */
export function ResponsiveExample() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  const isLargeScreen = useBreakpoint('lg');

  return (
    <ResponsiveSection padding="lg" background="gray">
      <ResponsiveContainer size="xl">
        <ResponsiveStack space="xl">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-responsive-4xl font-bold text-gray-900 mb-4">
              Mobile-First Responsive Design
            </h1>
            <p className="text-responsive-lg text-gray-600 max-w-2xl mx-auto">
              This page demonstrates our mobile-first approach to responsive design.
              Resize your browser to see how components adapt across different screen sizes.
            </p>
          </div>

          {/* Current Breakpoint Info */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800">Current Screen Info</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap="md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {breakpoint.toUpperCase()}
                  </div>
                  <div className="text-sm text-emerald-700">Breakpoint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {isMobile ? '📱' : isTablet ? '📟' : '💻'}
                  </div>
                  <div className="text-sm text-emerald-700">
                    {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {isLargeScreen ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-emerald-700">Large Screen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {window.innerWidth}px
                  </div>
                  <div className="text-sm text-emerald-700">Width</div>
                </div>
              </ResponsiveGrid>
            </CardContent>
          </Card>

          {/* Responsive Grid Example */}
          <div>
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-6">
              Responsive Grid
            </h2>
            <ResponsiveGrid 
              cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} 
              gap="lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <Card key={item} className="card-responsive">
                  <CardHeader>
                    <CardTitle>Card {item}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      This card adapts to different screen sizes using our responsive grid system.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </ResponsiveGrid>
          </div>

          {/* Responsive Flex Example */}
          <div>
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-6">
              Responsive Flex Layout
            </h2>
            <ResponsiveFlex
              direction={{ xs: 'col', md: 'row' }}
              align="center"
              justify="between"
              gap="lg"
            >
              <Card className="flex-1 card-responsive">
                <CardHeader>
                  <CardTitle>Flexible Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    This content stacks vertically on mobile and horizontally on desktop.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="flex-1 card-responsive">
                <CardHeader>
                  <CardTitle>Adaptive Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    The layout automatically adjusts based on screen size using flexbox.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="flex-1 card-responsive">
                <CardHeader>
                  <CardTitle>Mobile-First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Designed mobile-first, then enhanced for larger screens.
                  </p>
                </CardContent>
              </Card>
            </ResponsiveFlex>
          </div>

          {/* Typography Example */}
          <div>
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-6">
              Responsive Typography
            </h2>
            <Card className="card-responsive">
              <CardContent className="space-responsive-lg">
                <h1 className="text-responsive-4xl font-bold text-gray-900">
                  Heading 1 - Scales with screen size
                </h1>
                <h2 className="text-responsive-3xl font-bold text-gray-800">
                  Heading 2 - Responsive sizing
                </h2>
                <h3 className="text-responsive-2xl font-bold text-gray-700">
                  Heading 3 - Mobile-first approach
                </h3>
                <p className="text-responsive-lg text-gray-600">
                  This paragraph uses responsive text sizing that adapts to different screen sizes.
                  The text remains readable and appropriately sized across all devices.
                </p>
                <p className="text-responsive-base text-gray-600">
                  Base text size that provides optimal readability on all devices.
                  Our mobile-first approach ensures content is accessible everywhere.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Button Examples */}
          <div>
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-6">
              Responsive Buttons
            </h2>
            <ResponsiveFlex
              direction={{ xs: 'col', sm: 'row' }}
              gap="md"
              justify="center"
            >
              <button className="btn-responsive bg-emerald-600 text-white hover:bg-emerald-700">
                Primary Button
              </button>
              <button className="btn-responsive bg-gray-200 text-gray-800 hover:bg-gray-300">
                Secondary Button
              </button>
              <button className="btn-responsive border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                Outline Button
              </button>
            </ResponsiveFlex>
          </div>

          {/* Mobile-Specific Features */}
          {isMobile && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Mobile-Only Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  This content only appears on mobile devices. You can use responsive hooks
                  to show/hide content based on screen size.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Desktop-Specific Features */}
          {isDesktop && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Desktop-Only Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700">
                  This content only appears on desktop devices. Perfect for showing
                  additional information or features that work better on larger screens.
                </p>
              </CardContent>
            </Card>
          )}

        </ResponsiveStack>
      </ResponsiveContainer>
    </ResponsiveSection>
  );
}

export default ResponsiveExample;
