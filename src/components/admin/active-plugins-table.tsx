"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconSettings,
  IconPower,
  IconTrash,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiResponse } from "@/types/global";

interface InstalledPlugin {
  _id: string;
  pluginId: string;
  name: string;
  version: string;
  status: "installed" | "installing" | "failed" | "disabled";
  isActive: boolean;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    category: string;
    permissions: string[];
    author: {
      name: string;
      email: string;
    };
  };
  lastActivated?: Date;
  installedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const columns: ColumnDef<InstalledPlugin>[] = [
  {
    accessorKey: "name",
    header: "Plugin Name",
    cell: ({ row }) => {
      const plugin = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{plugin.name}</div>
          <div className="text-sm text-muted-foreground">
            {plugin.manifest.description}
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        v{row.original.version}
      </Badge>
    ),
  },
  {
    accessorKey: "manifest.category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs capitalize">
        {row.original.manifest.category}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status, isActive } = row.original;
      if (status === "installed" && isActive) {
        return (
          <Badge variant="default" className="text-xs">
            <IconCircleCheckFilled className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      } else if (status === "installed" && !isActive) {
        return (
          <Badge variant="secondary" className="text-xs">
            <IconPower className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
      } else if (status === "installing") {
        return (
          <Badge variant="outline" className="text-xs">
            <IconLoader className="w-3 h-3 mr-1 animate-spin" />
            Installing
          </Badge>
        );
      }
      return (
        <Badge variant="destructive" className="text-xs">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "manifest.permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.original.manifest.permissions || [];
      if (permissions.length === 0)
        return <span className="text-muted-foreground">None</span>;

      const displayPermissions = permissions.slice(0, 2);
      const remaining = permissions.length - displayPermissions.length;

      return (
        <div className="flex flex-wrap gap-1">
          {displayPermissions.map((permission) => (
            <Badge key={permission} variant="outline" className="text-xs">
              {permission.split(":")[0]}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="outline" className="text-xs">
              +{remaining} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivated",
    header: "Last Active",
    cell: ({ row }) => {
      const lastActivated = row.original.lastActivated;
      if (!lastActivated)
        return <span className="text-muted-foreground">Never</span>;

      return (
        <div className="text-sm">
          {new Date(lastActivated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const plugin = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical className="w-4 h-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>
              <IconSettings className="w-4 h-4 mr-2" />
              Configure
            </DropdownMenuItem>
            {plugin.isActive ? (
              <DropdownMenuItem>
                <IconPower className="w-4 h-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <IconTrash className="w-4 h-4 mr-2" />
              Uninstall
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ActivePluginsTable() {
  const [plugins, setPlugins] = React.useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  React.useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/plugins", {
        credentials: "include",
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success && data.data?.plugins) {
          setPlugins(data.data.plugins);
          setError(null);
        } else {
          setError(data.error || "Failed to load plugins");
        }
      } else {
        setError("Failed to fetch plugins");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Plugins fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable({
    data: plugins,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const activePlugins = plugins.filter((p) => p.isActive).length;
  const totalPlugins = plugins.length;

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-9 bg-muted rounded w-24 animate-pulse"></div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-64 bg-muted animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <h3 className="font-medium text-destructive">
            Error Loading Plugins
          </h3>
          <p className="text-sm text-destructive/80">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchPlugins}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue="overview"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Plugin Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {activePlugins} of {totalPlugins} plugins active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="w-4 h-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus className="w-4 h-4" />
            <span className="hidden lg:inline">Install Plugin</span>
          </Button>
        </div>
      </div>

      <TabsContent
        value="overview"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No plugins installed yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} plugin(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
