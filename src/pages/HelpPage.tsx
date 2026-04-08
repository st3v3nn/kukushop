import { useState } from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'How long does delivery take?',
    answer: 'Delivery typically takes 25-45 minutes depending on your location and order size. You can track your order in real-time through the app.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept M-Pesa mobile money payments and cash on delivery. Card payments coming soon!',
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order is confirmed, you can track it in real-time from the Orders section. You\'ll see status updates as your order is prepared and delivered.',
  },
  {
    question: 'What if my order is wrong or missing items?',
    answer: 'Please contact our support team immediately. We\'ll make it right by either replacing the items or issuing a refund.',
  },
  {
    question: 'Do you have a minimum order amount?',
    answer: 'There\'s no minimum order amount, but orders below KES 500 may have a higher delivery fee.',
  },
  {
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order within 5 minutes of placing it. After that, if the order is already being prepared, cancellation may not be possible.',
  },
];

const contactOptions = [
  {
    icon: Phone,
    title: 'Call Us',
    description: '+254 712 345 678',
    action: 'tel:+254712345678',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Chat with us',
    action: 'https://wa.me/254712345678',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'support@kukunisisi.co.ke',
    action: 'mailto:support@kukunisisi.co.ke',
  },
];

export const HelpPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-8 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <Header title="Help & Support" showBack />
      
      <main className="px-4 py-4 space-y-6">
        {/* Contact Options */}
        <section>
          <h2 className="text-lg font-bold mb-4">Contact Us</h2>
          <div className="grid grid-cols-3 gap-3">
            {contactOptions.map(option => {
              const Icon = option.icon;
              return (
                <a
                  key={option.title}
                  href={option.action}
                  className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 shadow-card text-center transition-transform active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{option.title}</span>
                </a>
              );
            })}
          </div>
        </section>

        {/* Business Hours */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Business Hours</h3>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Monday - Friday</span>
              <span>8:00 AM - 10:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Saturday - Sunday</span>
              <span>9:00 AM - 11:00 PM</span>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl bg-card shadow-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    openFaq === index ? 'max-h-48' : 'max-h-0'
                  )}
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Resources */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Additional Resources</h3>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-sm text-primary hover:underline">
              Terms of Service
            </a>
            <a href="#" className="block text-sm text-primary hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="block text-sm text-primary hover:underline">
              Delivery Policy
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HelpPage;
