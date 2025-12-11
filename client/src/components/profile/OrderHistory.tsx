import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useOrders } from "@/hooks/useOrders";

export function OrderHistory() {
    const ordersQuery = useOrders();

    const transactions = Array.isArray(ordersQuery.data?.data)
        ? ordersQuery.data.data.map((order: any) => ({
            id: order.id,
            date: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            amount: Number(order.total_amount),
            status: order.status,
            method: order.payment_method || 'Online Payment'
        }))
        : [];

    if (ordersQuery.isLoading) {
        return <div className="p-8 text-center text-stone-500">Loading orders...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="p-8 text-center text-stone-500 dark:text-neutral-500 bg-stone-50 dark:bg-neutral-900 rounded-lg">
                No orders found.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
        >
            {transactions.map((txn: any) => (
                <Card
                    key={txn.id}
                    className="p-6 border-none shadow-none bg-stone-50 dark:bg-neutral-900 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300"
                    data-testid={`card-transaction-${txn.id}`}
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="font-medium mb-1 dark:text-white">Order #{txn.id.slice(0, 8)}...</h3>
                            <p className="text-sm text-stone-500 dark:text-neutral-400">{txn.date}</p>
                            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">{txn.method}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-display dark:text-white">₹{txn.amount}</p>
                            <p className={`text-sm capitalize font-medium ${txn.status === 'completed' ? 'text-green-600 dark:text-green-500' :
                                    txn.status === 'pending' ? 'text-amber-600 dark:text-amber-500' :
                                        'text-stone-600 dark:text-stone-400'
                                }`}>
                                {txn.status}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </motion.div>
    );
}
