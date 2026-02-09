import Link from "next/link";
import { Users, Calendar, Clock, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface PostingCardProps {
  id: string;
  title: string;
  description: string;
  skills: string[];
  teamSize: string;
  estimatedTime: string;
  category: string;
  matchScore?: number;
  creator: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  createdAt: string;
  className?: string;
  onApply?: () => void;
}

export function PostingCard({
  id,
  title,
  description,
  skills,
  teamSize,
  estimatedTime,
  category,
  matchScore,
  creator,
  createdAt,
  className,
  onApply,
}: PostingCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{title}</CardTitle>
              {matchScore !== undefined && (
                <Badge variant="success">{matchScore}% match</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/postings/${id}`}>
                View Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {onApply && <Button onClick={onApply}>Apply</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm line-clamp-2">
          {description}
        </CardDescription>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 5).map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
          {skills.length > 5 && (
            <Badge variant="outline">+{skills.length - 5}</Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {teamSize}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {estimatedTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {category}
          </span>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {creator.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Posted by {creator.name} • {createdAt}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
