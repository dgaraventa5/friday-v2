import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Mitchell",
    title: "Product Manager",
    content: "Friday completely changed how I manage my day. I'm less stressed and more productive. The 4-task limit is genius—it forces me to focus on what really matters.",
    rating: 5,
    initials: "SM",
    color: "bg-blue-500"
  },
  {
    name: "Marcus Chen",
    title: "Software Engineer",
    content: "As someone with ADHD, having 50+ tasks on my list was paralyzing. Friday's automatic prioritization is exactly what I needed. I finally feel in control.",
    rating: 5,
    initials: "MC",
    color: "bg-purple-500"
  },
  {
    name: "Emily Rodriguez",
    title: "Entrepreneur",
    content: "I've tried every productivity app out there. Friday is the only one that actually reduced my stress instead of adding to it. Clean, simple, effective.",
    rating: 5,
    initials: "ER",
    color: "bg-green-500"
  }
];

export function SocialProofSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Join thousands focusing on what matters
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users are saying about Friday
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial content */}
              <blockquote className="text-muted-foreground leading-relaxed mb-6 flex-1">
                "{testimonial.content}"
              </blockquote>

              {/* User info */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`${testimonial.color} text-white font-semibold text-sm`}>
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {testimonials.map((t, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className={`${t.color} text-white text-xs`}>
                    {t.initials[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span>Join 1,000+ users who are focusing on what matters</span>
          </div>
        </div>
      </div>
    </section>
  );
}

