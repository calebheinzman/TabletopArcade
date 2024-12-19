'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TbCoin } from "react-icons/tb";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PlayerHandHeaderProps {
  currentPlayer: {
    username: string;
    num_points: number;
  };
  gameRules?: string;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
}

export function PlayerHandHeader({ currentPlayer, gameRules, showRules, setShowRules }: PlayerHandHeaderProps) {
  return (
    <div className="flex justify-between items-center p-2 md:px-6 lg:px-8">
      <h2 className="text-2xl font-bold">{currentPlayer.username}&apos;s Hand</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center text-lg">
          <div className="mr-2"><TbCoin size={24} /></div>
          <span className="font-semibold">{currentPlayer.num_points || 0}</span>
        </div>
        <div className="portrait:block landscape:hidden">
          {gameRules && (
            <Dialog open={showRules} onOpenChange={setShowRules}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Game Rules</DialogTitle>
                </DialogHeader>
                <div className="prose dark:prose-invert mt-4">
                  <ReactMarkdown 
                    children={gameRules || 'No rules available for this game.'} 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Ensure proper table rendering
                      table: ({node, ...props}) => (
                        <table className="border-collapse table-auto" {...props} />
                      ),
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
