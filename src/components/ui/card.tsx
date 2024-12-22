'use client';

import { cn } from '@/lib/utils';
import React from 'react';

// Simplified Card wrapper
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode; // Card content
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow transform-style-3d transition-transform duration-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

// Front of the card
const CardFront: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'absolute w-full h-full bg-card text-card-foreground shadow flex items-center justify-center backface-hidden',
      className
    )}
    style={{
      WebkitBackfaceVisibility: 'hidden',
      backfaceVisibility: 'hidden',
    }}
    {...props}
  >
    {children}
  </div>
);
CardFront.displayName = 'CardFront';

// Back of the card
const CardBack: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'absolute w-full h-full rounded-xl bg-gray-300 text-card-foreground shadow flex items-center justify-center rotate-y-180 backface-hidden',
      className
    )}
    style={{
      WebkitBackfaceVisibility: 'hidden',
      backfaceVisibility: 'hidden',
    }}
    {...props}
  >
    {children}
  </div>
);
CardBack.displayName = 'CardBack';

// PlayingCard with flipping logic
interface PlayingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  card: { isRevealed: boolean };
  front: React.ReactNode;
  back: React.ReactNode;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  front,
  back,
  className,
  ...props
}) => {
  const { isRevealed } = card;

  return (
    <Card
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow transform-style-3d transition-transform duration-500',
        isRevealed ? '' : 'rotate-y-180',
        className
      )}
      {...props}
    >
      {isRevealed ? front : back}
    </Card>
  );
};
PlayingCard.displayName = 'PlayingCard';

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardBack,
  CardContent,
  CardDescription,
  CardFooter,
  CardFront,
  CardHeader,
  CardTitle,
  PlayingCard,
};
