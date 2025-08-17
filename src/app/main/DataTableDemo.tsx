"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { AlertCircle, ArrowUpDown, Bell, ChevronDownIcon, Info, MoreHorizontal, Plus, Printer, Trash2 } from "lucide-react"
import { Toaster, toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Payment {
    id: string
    amount: number
    status: "pending" | "processing" | "success" | "failed"
    email: string
}

interface FormData {
    id: string
    amount: string
    status: Payment["status"]
    email: string
}

const initialData: Payment[] = []

export const columns: ColumnDef<Payment>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("status")}</div>
        ),
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "amount",
        header: () => (
            <div className="text-right flex items-center justify-end gap-2">
                Amount <AlertCircle className="h-4 w-4" />
            </div>
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
            const payment = row.original
            const now = new Date()
            const optionsDate: Intl.DateTimeFormatOptions = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }
            const formattedDate = now.toLocaleDateString("en-US", optionsDate)
            const optionsTime: Intl.DateTimeFormatOptions = {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            }
            const formattedTime = now.toLocaleTimeString("en-US", optionsTime)

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(payment.id)
                                toast("Payment ID copied to clipboard", {
                                    description: `${formattedDate} at ${formattedTime}`,
                                    action: {
                                        label: "Undo",
                                        onClick: () => console.log("Undo copy"),
                                    },
                                    position: "top-right",
                                })
                            }}
                        >
                            Copy payment ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                const setData = (table.options.meta as { setData: (data: Payment[]) => void })?.setData
                                if (setData) {
                                    const updatedData = table.options.data.filter(
                                        (item: Payment) => item.id !== payment.id
                                    )
                                    setData(updatedData)
                                    localStorage.setItem("payments", JSON.stringify(updatedData))
                                    toast("Payment deleted successfully", {
                                        description: `${formattedDate} at ${formattedTime}`,
                                        action: {
                                            label: "Undo",
                                            onClick: () => {
                                                setData([...table.options.data, payment])
                                                localStorage.setItem("payments", JSON.stringify([...table.options.data, payment]))
                                            },
                                        },
                                        position: "top-right",
                                    })
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                window.print()
                                toast("Print initiated", {
                                    description: `${formattedDate} at ${formattedTime}`,
                                    action: {
                                        label: "Cancel",
                                        onClick: () => console.log("Print cancelled"),
                                    },
                                    position: "top-right",
                                })
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export function DataTableDemo() {
    const [data, setData] = React.useState<Payment[]>(initialData)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [alert, setAlert] = React.useState({ show: false, message: "", type: "success" as "success" | "error" })
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            id: "",
            amount: "",
            status: "pending",
            email: "",
        },
    })

   
    React.useEffect(() => {
        const savedData = localStorage.getItem("payments")
        if (savedData) {
            setData(JSON.parse(savedData))
        }
    }, [])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        meta: {
            setData,
        },
    })

    const onSubmit = (formData: FormData) => {
        const now = new Date()
        const optionsDate: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }
        const formattedDate = now.toLocaleDateString("en-US", optionsDate)
        const optionsTime: Intl.DateTimeFormatOptions = {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        }
        const formattedTime = now.toLocaleTimeString("en-US", optionsTime)

        if (!formData.amount) {
            setAlert({
                show: true,
                message: "Amount is required.",
                type: "error",
            })
            setTimeout(() => setAlert({ show: false, message: "", type: "error" }), 3000)
            return
        }

        const payment: Payment = {
            id: formData.id,
            amount: parseFloat(formData.amount),
            status: formData.status,
            email: formData.email,
        }

        const updatedData = [...data, payment]
        setData(updatedData)
        localStorage.setItem("payments", JSON.stringify(updatedData))
        reset()
        setIsDialogOpen(false)
        toast.success(`Payment added successfully on ${formattedDate} at ${formattedTime}`, {
            position: "top-right",
        })
    }

    return (
        <div className="h-screen flex flex-col justify-center items-center gap-4 p-4">
            <Toaster richColors />
            {alert.show && (
                <Alert className="max-w-3xl mb-4">
                    {alert.type === "error" ? <Info className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    <AlertTitle>{alert.type === "success" ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
            )}
            <h1 className="text-3xl font-bold mb-4">Payment Records</h1>
            <div className="w-full max-w-3xl">
                <div className="flex items-center py-4 gap-4">
                    <Input
                        placeholder="Filter emails..."
                        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("email")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 hover:-translate-y-1 transition-all">
                                <Plus className="h-4 w-4" /> Add Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Payment</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                <div>
                                    <Controller
                                        name="id"
                                        control={control}
                                        rules={{ required: "Payment ID is required" }}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Payment ID"
                                                {...field}
                                                className={errors.id ? "border-red-500" : ""}
                                            />
                                        )}
                                    />
                                    {errors.id && (
                                        <p className="flex items-center text-red-500 text-sm mt-1">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.id.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Controller
                                        name="amount"
                                        control={control}
                                        rules={{ required: "Amount is required", pattern: { value: /^\d+(\.\d+)?$/, message: "Invalid amount" } }}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                placeholder="Amount"
                                                {...field}
                                                className={errors.amount ? "border-red-500" : ""}
                                            />
                                        )}
                                    />
                                    {errors.amount && (
                                        <p className="flex items-center text-red-500 text-sm mt-1">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.amount.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Controller
                                        name="status"
                                        control={control}
                                        rules={{ required: "Status is required" }}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                    <SelectItem value="success">Success</SelectItem>
                                                    <SelectItem value="failed">Failed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.status && (
                                        <p className="flex items-center text-red-500 text-sm mt-1">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.status.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } }}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Email"
                                                {...field}
                                                className={errors.email ? "border-red-500" : ""}
                                            />
                                        )}
                                    />
                                    {errors.email && (
                                        <p className="flex items-center text-red-500 text-sm mt-1">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" className="flex items-center gap-2 hover:-translate-y-1 transition-all">
                                    <Plus className="h-4 w-4" /> Add Payment
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto flex items-center gap-2 hover:-translate-y-1 transition-all">
                                Columns <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <ScrollArea className="h-fit overflow-hidden rounded-md shadow-lg border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="text-muted-foreground flex-1 text-sm">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                </div>
            </div>
        </div>
    )
}