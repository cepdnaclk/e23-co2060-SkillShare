import { useEffect, useMemo, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import ErrorBanner from "@/components/ErrorBanner";
import { adminApi } from "@/api/admin.api";
import { reportApi } from "@/api/report.api";
import type { AdminOverviewDto, AdminSessionDto, AdminUserDto, Skill } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Ban, CheckCircle2, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldAlert, RotateCw } from "lucide-react";

function Metric({ label, value }: { label: string; value: number }) {
  return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </CardContent>
      </Card>
  );
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (status === "PENDING") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  if (status === "CANCELLED" || status === "REJECTED" || status === "EXPIRED") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-secondary text-secondary-foreground border-border";
}

const Admin = () => {
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<AdminSessionDto[]>([]);
  const [search, setSearch] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedUserId = searchParams.get("highlight");
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Which tab is active. Defaults to "users", but respects a ?tab= param so
  // links (e.g. a highlight deep-link) can land on the right tab directly.
  const activeTab = searchParams.get("tab") === "sessions" ? "sessions" : "users";

  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "users") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  const loadAll = async () => {
    setError(null);
    const [overviewRes, usersRes, skillsRes, sessionsRes, reportsRes] = await Promise.all([
      adminApi.getOverview(),
      adminApi.getUsers(search),
      adminApi.getSkills(),
      adminApi.getSessions(),
      reportApi.getAllReports(),
    ]);
    setOverview(overviewRes);
    setUsers(usersRes);
    setSkills(skillsRes);
    setSessions(sessionsRes);
    setPendingReportsCount(reportsRes.filter((r) => r.status === "PENDING").length);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadAll()
        .catch((err) => mounted && setError(err.message ?? "Failed to load admin data"))
        .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Auto-scroll to highlighted user row after data finishes loading.
  // Also makes sure we're on the Users tab, since the row only exists there.
  useEffect(() => {
    if (!loading && highlightedUserId) {
      if (activeTab !== "users") {
        setActiveTab("users");
        return;
      }
      highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, highlightedUserId, activeTab]);

  const filteredUsers = useMemo(() => users, [users]);

  const runSearch = async () => {
    try {
      setUsers(await adminApi.getUsers(search));
    } catch (err) {
      setError((err as Error).message ?? "User search failed");
    }
  };

  const updateUser = async (user: AdminUserDto, change: Partial<Pick<AdminUserDto, "role" | "isActive">>) => {
    setSavingId(user.id);
    try {
      const updated = await adminApi.updateUser(user.id, change);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success("User updated");
    } catch (err) {
      setError((err as Error).message ?? "Failed to update user");
    } finally {
      setSavingId(null);
    }
  };

  const addSkill = async () => {
    if (!skillName.trim()) return;
    try {
      const created = await adminApi.createSkill(skillName, skillCategory || "General");
      setSkills((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSkillName("");
      setSkillCategory("");
      toast.success("Skill added");
    } catch (err) {
      setError((err as Error).message ?? "Failed to add skill");
    }
  };

  const deleteSkill = async (skill: Skill) => {
    try {
      await adminApi.deleteSkill(skill.id);
      setSkills((current) => current.filter((item) => item.id !== skill.id));
      toast.success("Skill deleted");
    } catch (err) {
      setError((err as Error).message ?? "Failed to delete skill");
    }
  };

  return (
      <AppLayout>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">System Control</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage users, skills, reports, and live session state from one secured surface.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                  variant="destructive"
                  onClick={() => navigate("/admin/reports")}
                  className="relative gap-2"
              >
                <ShieldAlert className="h-4 w-4" />
                View Reports
                {pendingReportsCount > 0 && (
                    <span
                        className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[11px] font-semibold text-destructive ring-2 ring-destructive"
                        aria-label={`${pendingReportsCount} pending reports`}
                    >
                      {pendingReportsCount > 99 ? "99+" : pendingReportsCount}
                    </span>
                )}
              </Button>

              <Button
                  variant="outline"
                  onClick={() => loadAll().catch((err) => setError(err.message))}
                  className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <ErrorBanner error={error} onDismiss={() => setError(null)} />

          {loading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-secondary" />)}
              </div>
          ) : (
              <>
                {overview && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Metric label="Users" value={overview.totalUsers} />
                      <Metric label="Active Users" value={overview.activeUsers} />
                      <Metric label="Skills" value={overview.totalSkills} />
                      <Metric label="Pending Sessions" value={overview.pendingSessions} />
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="users" className="gap-2">
                      <Users className="h-4 w-4" />
                      Users & Skills
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="gap-2">
                      <Activity className="h-4 w-4" />
                      Sessions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="mt-4">
                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-0">
                          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <h2 className="font-semibold">Users</h2>
                            </div>
                            <div className="flex gap-2">
                              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="h-9 w-56" />
                              <Button size="sm" onClick={runSearch} className="gap-2">
                                <Search className="h-4 w-4" />
                                Search
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>User</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Reputation</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredUsers.map((user) => {
                                  const isHighlighted = user.id === highlightedUserId;
                                  return (
                                      <TableRow
                                          key={user.id}
                                          ref={isHighlighted ? highlightedRowRef : null}
                                          className={
                                            isHighlighted
                                                ? "bg-destructive/10 dark:bg-destructive/20 border-l-4 border-l-destructive animate-pulse transition-all"
                                                : ""
                                          }
                                      >
                                        <TableCell>
                                          <div className="font-medium flex items-center gap-2">
                                            {user.fullName}
                                            {isHighlighted && (
                                                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                                  Reported Target
                                                </Badge>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                    <span className={user.isActive ? "text-emerald-700" : "text-destructive font-medium"}>
                                      {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                        </TableCell>
                                        <TableCell>{user.reputationScore ?? 0}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={savingId === user.id}
                                                onClick={() => updateUser(user, { role: user.role === "ADMIN" ? "USER" : "ADMIN" })}
                                            >
                                              {user.role === "ADMIN" ? "Make User" : "Make Admin"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={user.isActive ? "destructive" : "outline"}
                                                disabled={savingId === user.id}
                                                onClick={() => updateUser(user, { isActive: !user.isActive })}
                                                className="gap-1"
                                            >
                                              {user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                              {user.isActive ? "Disable" : "Enable"}
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 shadow-sm">
                        <CardContent className="p-0">
                          <div className="border-b border-border p-4">
                            <h2 className="font-semibold">Skills</h2>
                            <div className="mt-3 grid gap-2">
                              <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Skill name" />
                              <Input value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} placeholder="Category" />
                              <Button onClick={addSkill} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Skill
                              </Button>
                            </div>
                          </div>
                          <div className="max-h-[460px] overflow-y-auto p-2">
                            {skills.map((skill) => (
                                <div key={skill.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-secondary/60">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">{skill.name}</div>
                                    <div className="truncate text-xs text-muted-foreground">{skill.category || "Uncategorized"}</div>
                                  </div>
                                  <Button size="icon" variant="ghost" onClick={() => deleteSkill(skill)} aria-label={`Delete ${skill.name}`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-4">
                    <Card className="border-border/60 shadow-sm">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-2 border-b border-border p-4">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <h2 className="font-semibold">Recent Sessions</h2>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Skill</TableHead>
                                <TableHead>Learner</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sessions.map((session) => (
                                  <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.skillName}</TableCell>
                                    <TableCell>{session.learnerName}</TableCell>
                                    <TableCell>{session.mentorName}</TableCell>
                                    <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                                    <TableCell>
                                <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusTone(session.status)}`}>
                                  {session.status}
                                </span>
                                    </TableCell>
                                  </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
          )}
        </div>
      </AppLayout>
  );
};

export default Admin;
