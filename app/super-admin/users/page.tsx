'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, COLLECTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
          Table,
          TableBody,
          TableCell,
          TableHead,
          TableHeader,
          TableRow,
} from '@/components/ui/table';
import { UserX, UserCheck, Shield } from 'lucide-react';
import { Loading } from '@/components/shared/Loading';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
          const { toast } = useToast();
          const [users, setUsers] = useState<User[]>([]);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    fetchUsers();
          }, []);

          const fetchUsers = async () => {
                    try {
                              setLoading(true);
                              const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                              const usersData = snapshot.docs.map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                              })) as User[];
                              setUsers(usersData);
                    } catch (error) {
                              console.error('Error fetching users:', error);
                    } finally {
                              setLoading(false);
                    }
          };

          const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
                    try {
                              await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
                                        isActive: !currentStatus,
                              });

                              toast({
                                        title: 'Success',
                                        description: `User ${!currentStatus ? 'activated' : 'deactivated'}`,
                              });

                              fetchUsers();
                    } catch (error: any) {
                              toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to update user status',
                                        variant: 'destructive',
                              });
                    }
          };

          if (loading) {
                    return <Loading text="Loading users..." />;
          }

          return (
                    <div className="space-y-6">
                              <div>
                                        <h1 className="text-4xl font-bold text-gradient">User Management</h1>
                                        <p className="text-dark-text-secondary mt-2">
                                                  Manage all platform users
                                        </p>
                              </div>

                              <Card className="glass-card p-6">
                                        <Table>
                                                  <TableHeader>
                                                            <TableRow className="border-white/10 hover:bg-white/5">
                                                                      <TableHead>Name</TableHead>
                                                                      <TableHead>Email</TableHead>
                                                                      <TableHead>Role</TableHead>
                                                                      <TableHead>Status</TableHead>
                                                                      <TableHead>Joined</TableHead>
                                                                      <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                            {users.map((user) => (
                                                                      <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                                                                <TableCell className="font-medium">
                                                                                          {user.profile.firstName} {user.profile.lastName}
                                                                                </TableCell>
                                                                                <TableCell>{user.profile.email}</TableCell>
                                                                                <TableCell>
                                                                                          <Badge
                                                                                                    variant="outline"
                                                                                                    className={
                                                                                                              user.role === 'super_admin'
                                                                                                                        ? 'border-neon-purple text-neon-purple'
                                                                                                                        : user.role === 'admin'
                                                                                                                                  ? 'border-neon-magenta text-neon-magenta'
                                                                                                                                  : 'border-neon-cyan text-neon-cyan'
                                                                                                    }
                                                                                          >
                                                                                                    {user.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                                                                                                    {user.role.replace('_', ' ').toUpperCase()}
                                                                                          </Badge>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                          {user.isActive ? (
                                                                                                    <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                                                                                          ) : (
                                                                                                    <Badge className="bg-red-500/20 text-red-500">Inactive</Badge>
                                                                                          )}
                                                                                </TableCell>
                                                                                <TableCell className="text-sm">
                                                                                          {user.createdAt && formatDate(user.createdAt.toDate())}
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                          <Button
                                                                                                    size="sm"
                                                                                                    variant="outline"
                                                                                                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                                                                                                    className={
                                                                                                              user.isActive
                                                                                                                        ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                                                                                                        : 'border-green-500/30 text-green-500 hover:bg-green-500/10'
                                                                                                    }
                                                                                          >
                                                                                                    {user.isActive ? (
                                                                                                              <>
                                                                                                                        <UserX className="w-4 h-4 mr-2" />
                                                                                                                        Ban
                                                                                                              </>
                                                                                                    ) : (
                                                                                                              <>
                                                                                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                                                                                        Unban
                                                                                                              </>
                                                                                                    )}
                                                                                          </Button>
                                                                                </TableCell>
                                                                      </TableRow>
                                                            ))}
                                                  </TableBody>
                                        </Table>
                              </Card>
                    </div>
          );
}
