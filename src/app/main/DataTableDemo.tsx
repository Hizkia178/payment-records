"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { AlertCircle, ArrowUpDown, Bell, ChevronDownIcon, Info, MoreHorizontal, Plus, Printer, Trash2, SearchX, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { AlertCircleIcon, BadgeCheckIcon } from "lucide-react"
import { getPayments, createPayment, deletePayment, Status } from "@/app/actions"
import { Payment } from "../types"

// Fungsi untuk menghasilkan ID acak berdasarkan tanggal, bulan, dan tahun
const generatePaymentId = (): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${year}${month}${day}-${randomStr}`;
};

interface FormData {
    amount: string
    status: Status
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
                aria-label="Pilih semua"
                className="hidden md:flex"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Pilih baris"
                className="hidden md:flex"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as Payment["status"];
            let badgeContent = null;
            switch (status) {
                case "pending":
                    badgeContent = (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-600">
                            <AlertCircleIcon className="w-4 h-4 mr-1" />
                            Menunggu
                        </Badge>
                    );
                    break;
                case "processing":
                    badgeContent = (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            Sedang Diproses
                        </Badge>
                    );
                    break;
                case "success":
                    badgeContent = (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-600">
                            <BadgeCheckIcon className="w-4 h-4 mr-1" />
                            Berhasil
                        </Badge>
                    );
                    break;
                case "failed":
                    badgeContent = (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-600">
                            <AlertCircleIcon className="w-4 h-4 mr-1" />
                            Gagal
                        </Badge>
                    );
                    break;
            }
            return badgeContent;
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0"
            >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="lowercase truncate">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "amount",
        header: () => (
            <div className="text-right flex items-center justify-end gap-2">
                Jumlah <AlertCircle className="h-4 w-4" />
            </div>
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
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
            const formattedDate = now.toLocaleDateString("id-ID", optionsDate)
            const optionsTime: Intl.DateTimeFormatOptions = {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            }
            const formattedTime = now.toLocaleTimeString("id-ID", optionsTime)

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(payment.id)
                                toast("ID Pembayaran disalin ke clipboard", {
                                    description: `${formattedDate} pada ${formattedTime}`,
                                    action: {
                                        label: "Batalkan",
                                        onClick: () => console.log("Batalkan salin"),
                                    },
                                    position: "top-right",
                                })
                            }}
                        >
                            Salin ID Pembayaran
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={async () => {
                                const setData = (table.options.meta as { setData: (data: Payment[]) => void })?.setData
                                if (setData) {
                                    await deletePayment(payment.id)
                                    const updatedData = await getPayments()
                                    setData(updatedData)
                                    toast("Pembayaran berhasil dihapus", {
                                        description: `${formattedDate} pada ${formattedTime}`,
                                        action: {
                                            label: "Batalkan",
                                            onClick: async () => {
                                                await createPayment(payment)
                                                const revertedData = await getPayments()
                                                setData(revertedData)
                                            },
                                        },
                                        position: "top-right",
                                    })
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                window.print()
                                toast("Cetak dimulai", {
                                    description: `${formattedDate} pada ${formattedTime}`,
                                    action: {
                                        label: "Batalkan",
                                        onClick: () => console.log("Cetak dibatalkan"),
                                    },
                                    position: "top-right",
                                })
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" /> Cetak
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
            amount: "",
            status: "pending" as Status,
            email: "",
        },
    })

    React.useEffect(() => {
        async function fetchData() {
            const payments = await getPayments()
            setData(payments)
        }
        fetchData()
    }, [])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        meta: {
            setData,
        },
    })

    const onSubmit = async (formData: FormData) => {
        const now = new Date()
        const optionsDate: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }
        const formattedDate = now.toLocaleDateString("id-ID", optionsDate)
        const optionsTime: Intl.DateTimeFormatOptions = {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        }
        const formattedTime = now.toLocaleTimeString("id-ID", optionsTime)

        if (!formData.amount) {
            setAlert({
                show: true,
                message: "Jumlah wajib diisi.",
                type: "error",
            })
            setTimeout(() => setAlert({ show: false, message: "", type: "error" }), 3000)
            return
        }

        const payment: Payment = {
            id: generatePaymentId(),
            amount: parseFloat(formData.amount),
            status: formData.status,
            email: formData.email,
        }

        await createPayment(payment)
        const updatedData = await getPayments()
        setData(updatedData)
        reset()
        setIsDialogOpen(false)
        toast("Pembayaran berhasil ditambahkan", {
            description: `${formattedDate} pada ${formattedTime}`,
            action: {
                label: "Batalkan",
                onClick: async () => {
                    await deletePayment(payment.id)
                    const revertedData = await getPayments()
                    setData(revertedData)
                },
            },
            position: "top-right",
        })
    }

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8">
            <Toaster richColors />
            {alert.show && (
                <Alert className="max-w-3xl mb-4 mx-auto">
                    {alert.type === "error" ? <Info className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    <AlertTitle>{alert.type === "success" ? "Berhasil" : "Kesalahan"}</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
            )}
            <div className="mb-6 text-center">
                <h1 className="text-2xl md:text-3xl font-bold">Catatan Pembayaran</h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">
                    Kelola dan pantau semua transaksi pembayaran Anda dengan mudah
                </p>
            </div>
            <div className="w-full max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center py-4 gap-4">
                    <Input
                        placeholder="Filter email..."
                        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("email")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm w-full"
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 hover:-translate-y-1 transition-all w-full sm:w-auto">
                                <Plus className="h-4 w-4" /> Tambah Pembayaran
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah Pembayaran Baru</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                <div>
                                    <Controller
                                        name="amount"
                                        control={control}
                                        rules={{ required: "Jumlah wajib diisi", pattern: { value: /^\d+(\.\d+)?$/, message: "Jumlah tidak valid" } }}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                placeholder="Jumlah"
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
                                        rules={{ required: "Status wajib diisi" }}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Menunggu</SelectItem>
                                                    <SelectItem value="processing">Sedang Diproses</SelectItem>
                                                    <SelectItem value="success">Berhasil</SelectItem>
                                                    <SelectItem value="failed">Gagal</SelectItem>
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
                                        rules={{ required: "Email wajib diisi", pattern: { value: /^\S+@\S+$/i, message: "Alamat email tidak valid" } }}
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
                                    <Plus className="w-4 h-4" /> Tambah Pembayaran
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 hover:-translate-y-1 transition-all w-full sm:w-auto">
                                Kolom <ChevronDownIcon className="h-4 w-4" />
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
                <ScrollArea className="h-[400px] rounded-md shadow-lg border">
                    <Table className="w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-xs md:text-sm px-2 sticky top-0 bg-background z-10">
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
                                        className="text-xs md:text-sm"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-2 py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <SearchX className="w-6 h-6 mb-1" />
                                            <span>Tidak ada hasil.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 py-4">
                    <div className="text-muted-foreground text-xs md:text-sm">
                        {table.getFilteredSelectedRowModel().rows.length} dari{" "}
                        {table.getFilteredRowModel().rows.length} baris dipilih.
                    </div>
                    {data.length > 10 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" /> Sebelumnya
                            </Button>
                            <span className="text-xs md:text-sm">
                                Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="flex items-center gap-1"
                            >
                                Berikutnya <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}