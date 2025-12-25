import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageLayout from "@/components/PageLayout";

export default function SizeGuide() {
    return (
        <PageLayout>
            <main className="flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Fit & Measurements
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
                            Size Guide
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
                            Use our size guide to find your perfect fit. If you are between sizes, we recommend sizing up for a more relaxed fit or sizing down for a tailored look.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Tabs defaultValue="men" className="w-full">
                            <div className="flex justify-center mb-12">
                                <TabsList className="bg-stone-100 dark:bg-neutral-900 p-1 rounded-full">
                                    <TabsTrigger
                                        value="men"
                                        className="rounded-full px-8 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 transition-all"
                                    >
                                        Men's Sizing
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="women"
                                        className="rounded-full px-8 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 transition-all"
                                    >
                                        Women's Sizing
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="men">
                                <div className="border border-stone-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900/50">
                                    <Table>
                                        <TableHeader className="bg-stone-50 dark:bg-neutral-900">
                                            <TableRow className="border-stone-200 dark:border-neutral-800 hover:bg-transparent">
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Size</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Chest (in)</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Waist (in)</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Sleeve (in)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { size: "XS", chest: "34-36", waist: "28-30", sleeve: "32" },
                                                { size: "S", chest: "36-38", waist: "30-32", sleeve: "33" },
                                                { size: "M", chest: "38-40", waist: "32-34", sleeve: "34" },
                                                { size: "L", chest: "40-42", waist: "34-36", sleeve: "35" },
                                                { size: "XL", chest: "42-44", waist: "36-38", sleeve: "36" },
                                                { size: "XXL", chest: "44-46", waist: "38-40", sleeve: "36.5" },
                                            ].map((row, i) => (
                                                <TableRow key={i} className="border-stone-100 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <TableCell className="font-medium text-stone-900 dark:text-white">{row.size}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.chest}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.waist}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.sleeve}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="women">
                                <div className="border border-stone-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900/50">
                                    <Table>
                                        <TableHeader className="bg-stone-50 dark:bg-neutral-900">
                                            <TableRow className="border-stone-200 dark:border-neutral-800 hover:bg-transparent">
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Size</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Bust (in)</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Waist (in)</TableHead>
                                                <TableHead className="text-stone-900 dark:text-white font-display text-lg h-14">Hips (in)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { size: "XS", bust: "31-32", waist: "24-25", hips: "34-35" },
                                                { size: "S", bust: "33-34", waist: "26-27", hips: "36-37" },
                                                { size: "M", bust: "35-36", waist: "28-29", hips: "38-39" },
                                                { size: "L", bust: "37-39", waist: "30-32", hips: "40-42" },
                                                { size: "XL", bust: "40-42", waist: "33-35", hips: "43-45" },
                                            ].map((row, i) => (
                                                <TableRow key={i} className="border-stone-100 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <TableCell className="font-medium text-stone-900 dark:text-white">{row.size}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.bust}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.waist}</TableCell>
                                                    <TableCell className="text-stone-600 dark:text-neutral-400">{row.hips}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </main>
        </PageLayout>
    );
}
