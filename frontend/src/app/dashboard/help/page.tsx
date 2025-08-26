"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { FiHelpCircle, FiMessageSquare, FiBookOpen } from "react-icons/fi";

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by going to the login page and clicking the 'Forgot Password' link. You will receive an email with instructions."
  },
  {
    question: "How do I view my test results?",
    answer: "Navigate to the 'My Tests' section from the dashboard to see a history of all your attempted tests and their detailed analysis."
  },
  {
    question: "Can I retake a test?",
    answer: "This depends on the test configuration set by the administrator. Some tests may be available for multiple attempts, while others are not."
  },
  {
    question: "Where can I find study materials?",
    answer: "All available study materials, including notes and videos, can be found in the 'Study Material' section of your dashboard."
  }
];

export default function HelpPage() {
  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Help & Support
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Find answers to common questions and get in touch with our support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiHelpCircle className="mr-3 text-gray-500" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Us & Resources */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiMessageSquare className="mr-3 text-gray-500" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g., Issue with a test" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Describe your issue in detail..." />
              </div>
              <Button className="w-full">Send Message</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiBookOpen className="mr-3 text-gray-500" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-emerald-600 hover:underline">User Guide</a></li>
                <li><a href="#" className="text-emerald-600 hover:underline">Video Tutorials</a></li>
                <li><a href="#" className="text-emerald-600 hover:underline">Terms of Service</a></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
