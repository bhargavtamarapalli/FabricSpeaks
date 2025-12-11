import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BarChart2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PollData {
    id: string;
    title: string;
    content: {
        question: string;
        options: string[];
    };
    user_voted: boolean;
    user_vote_index: number | null;
}

interface PollResults {
    total_votes: number;
    results: Record<number, number>;
}

export function PollWidget() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Fetch active poll
    const { data: poll, isLoading } = useQuery({
        queryKey: ['active-poll'],
        queryFn: async () => {
            const res = await api.get('/api/polls/active');
            if (!res) return null;
            return res as PollData;
        },
    });

    // Fetch results if user voted
    const { data: results } = useQuery({
        queryKey: ['poll-results', poll?.id],
        queryFn: async () => {
            if (!poll?.id) return null;
            return await api.get(`/api/polls/${poll.id}/results`) as PollResults;
        },
        enabled: !!poll?.user_voted,
    });

    const voteMutation = useMutation({
        mutationFn: async (optionIndex: number) => {
            await api.post(`/api/polls/${poll?.id}/vote`, { option_index: optionIndex });
        },
        onSuccess: () => {
            toast({ title: "Vote recorded!" });
            queryClient.invalidateQueries({ queryKey: ['active-poll'] });
            queryClient.invalidateQueries({ queryKey: ['poll-results'] });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to vote",
                description: error.message || "Please try again",
                variant: "destructive"
            });
        }
    });

    if (isLoading || !poll) return null;

    const handleVote = () => {
        if (!user) {
            toast({
                title: "Login required",
                description: "Please login to vote in polls",
                variant: "destructive"
            });
            return;
        }
        if (selectedOption !== null) {
            voteMutation.mutate(parseInt(selectedOption));
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-8 border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <BarChart2 className="h-5 w-5 text-indigo-600" />
                    Community Poll
                </CardTitle>
            </CardHeader>
            <CardContent>
                <h3 className="text-base font-medium mb-4 text-slate-700">
                    {poll.content.question}
                </h3>

                {poll.user_voted && results ? (
                    <div className="space-y-4">
                        {poll.content.options.map((option, index) => {
                            const votes = results.results[index] || 0;
                            const percentage = results.total_votes > 0
                                ? Math.round((votes / results.total_votes) * 100)
                                : 0;
                            const isUserChoice = poll.user_vote_index === index;

                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className={`font-medium ${isUserChoice ? 'text-indigo-600' : 'text-slate-600'}`}>
                                            {option} {isUserChoice && '(You)'}
                                        </span>
                                        <span className="text-slate-500">{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                    <div className="text-xs text-slate-400 text-right">{votes} votes</div>
                                </div>
                            );
                        })}
                        <div className="pt-2 text-center text-xs text-slate-400">
                            Total votes: {results.total_votes}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption}>
                            {poll.content.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-50">
                                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-normal text-slate-700">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={selectedOption === null || voteMutation.isPending}
                            onClick={handleVote}
                        >
                            {voteMutation.isPending ? "Voting..." : "Vote Now"}
                        </Button>
                        {!user && (
                            <p className="text-xs text-center text-slate-400 mt-2">
                                Login to participate in polls
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
