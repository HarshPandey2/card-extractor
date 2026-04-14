import { useState } from "react";
import { Search, Trash2, Mail, Phone, Building, ExternalLink, Calendar, ChevronLeft, ChevronRight, Users, User, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAdminCards, useDeleteAdminCard, useAdminUsers, exportAdminCardsToExcel } from "@/hooks/use-admin";
import { useDebounce } from "@/hooks/use-debounce";
import type { CardRecord } from "@workspace/api-client-react";

type TabType = "cards" | "users";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("cards");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useAdminCards({
    search: debouncedSearch,
    page,
    limit,
  });

  const { data: usersData, isLoading: isUsersLoading } = useAdminUsers();

  const { mutate: deleteCard, isPending: isDeleting } = useDeleteAdminCard();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(id);
    deleteCard({ id }, {
      onSettled: () => setDeletingId(null),
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAdminCardsToExcel({ search: debouncedSearch });
    } catch (error) {
      alert("Failed to export cards. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all extracted business cards and users.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Cards", value: data?.total ?? "—", icon: Building },
            { label: "Total Users", value: usersData?.total ?? "—", icon: Users },
            { label: "This Page", value: data?.cards?.length ?? "—", icon: Search },
            { label: "Pages", value: data?.totalPages ?? "—", icon: ChevronRight },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 animate-in fade-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-full border border-border bg-secondary/50 p-1 w-fit mb-6">
          {(["cards", "users"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "cards" && (
          <>
            {/* Search and Export */}
            <div className="flex gap-4 items-center">
              <div className="relative max-w-md w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="block w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                  placeholder="Search names, companies, emails..."
                />
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center h-10 px-4 rounded-full border border-border bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
                title="Export all cards to Excel"
              >
                {isExporting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            </div>

            {isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
                Failed to load records. Your session may have expired.
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-card border border-border" />
                ))}
              </div>
            ) : !data?.cards.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
                <div className="rounded-full bg-secondary p-4 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">No records found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {search ? "Try adjusting your search terms." : "No business cards have been extracted yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.cards.map((card: CardRecord, index) => (
                    <div
                      key={card.id}
                      className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 animate-in fade-in zoom-in-95"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    >
                      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(card.id)}
                          disabled={isDeleting && deletingId === card.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Delete record"
                        >
                          {isDeleting && deletingId === card.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold text-foreground line-clamp-1">{card.data.name || "Unnamed"}</h3>
                        <div className="mt-1 flex items-center text-sm text-primary font-medium gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            {card.data.designation ? `${card.data.designation} at ` : ""}{card.data.company || "No Company"}
                          </span>
                        </div>
                        {card.userName && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>by {card.userName}</span>
                          </div>
                        )}

                        <div className="mt-5 space-y-3">
                          {card.data.emails?.[0] && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                <Mail className="h-3.5 w-3.5" />
                              </div>
                              <a href={`mailto:${card.data.emails[0]}`} className="hover:text-primary transition-colors line-clamp-1">
                                {card.data.emails[0]}
                              </a>
                            </div>
                          )}
                          {card.data.phones?.[0] && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                <Phone className="h-3.5 w-3.5" />
                              </div>
                              <a href={`tel:${card.data.phones[0]}`} className="hover:text-primary transition-colors line-clamp-1">
                                {card.data.phones[0]}
                              </a>
                            </div>
                          )}
                          {card.data.website && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </div>
                              <a href={card.data.website.startsWith("http") ? card.data.website : `https://${card.data.website}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors line-clamp-1">
                                {card.data.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground/70">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Extracted {formatDate(card.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(page * limit, data.total)}</span> of{" "}
                      <span className="font-medium text-foreground">{data.total}</span> results
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                        disabled={page === data.totalPages}
                        className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <>
            {isUsersLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-card border border-border" />
                ))}
              </div>
            ) : !usersData?.users.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
                <div className="rounded-full bg-secondary p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">No users yet</h3>
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card animate-in fade-in">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Verified</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Cards</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((user, index) => (
                      <tr key={user.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${index % 2 === 0 ? "" : "bg-secondary/10"}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.isVerified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {user.isVerified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.cardCount}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
