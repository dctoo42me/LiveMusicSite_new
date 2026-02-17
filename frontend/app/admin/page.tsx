// frontend/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getClaims, updateClaimStatus, getAdminStats, getAuditLogs, getAllSupportTickets, updateTicketStatus, getAdminSubscriptions, getSearchHeatmapData } from '@/services/api';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tabs,
  Tab,
  Stack,
  Divider,
  Grid,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import { APIProvider, Map as GoogleMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface Claim {
  id: number;
  userId: number;
  venueId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proofUrl: string | null;
  details: string | null;
  username: string;
  email: string;
  venueName: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalOperators: number;
  totalVenues: number;
  verifiedVenues: number;
  totalEvents: number;
  openTickets: number;
}

interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: any;
  createdAt: string;
}

interface SupportTicket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  userId?: number;
}

interface ProVenue {
  id: number;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  ownerName: string;
  ownerEmail: string;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const [tabValue, setTabValue] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subscriptions, setSubscriptions] = useState<ProVenue[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      const timeout = setTimeout(() => {
        if (!user || user.role !== 'admin') {
          showToast('Access denied. Admin only.', 'error');
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }

    const fetchAdminData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [claimsData, statsData, logsData, ticketsData, subsData, heatData] = await Promise.all([
          getClaims(token),
          getAdminStats(token),
          getAuditLogs(token),
          getAllSupportTickets(token),
          getAdminSubscriptions(token),
          getSearchHeatmapData(token)
        ]);
        setClaims(claimsData);
        setStats(statsData);
        setLogs(logsData);
        setTickets(ticketsData);
        setSubscriptions(subsData);
        setHeatmapData(heatData || []);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        showToast('Failed to load admin dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, token, router, showToast]);

  const handleUpdateClaim = async (claimId: number, status: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    setActionActionLoading(claimId);
    try {
      await updateClaimStatus(token, claimId, status);
      showToast(`Claim ${status.toLowerCase()} successfully!`, 'success');
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
      
      const newStats = await getAdminStats(token);
      setStats(newStats);
    } catch (err) {
      showToast('Failed to update claim status.', 'error');
    } finally {
      setActionActionLoading(null);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: number, status: string) => {
    if (!token) return;
    try {
      await updateTicketStatus(token, ticketId, status);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: status as any } : t));
      showToast('Ticket status updated.', 'success');
    } catch (err) {
      showToast('Failed to update ticket.', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            {title}
          </Typography>
          <Box sx={{ p: 1, bgcolor: `${color}.main`, borderRadius: 1.5, display: 'flex', color: 'white' }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );

  const HeatmapLayer = ({ data }: { data: HeatmapPoint[] }) => {
    const visualizationLib = useMapsLibrary('visualization');
    const map = useMapsLibrary('core'); // Just to ensure map is loaded
    
    useEffect(() => {
      if (!visualizationLib || !data.length) return;

      // In a real vis.gl implementation, we'd use their layer, 
      // but for pure Google Maps Heatmap:
      // Note: This is a simplified placeholder for the heatmap logic
    }, [visualizationLib, data]);

    return null; 
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <GavelIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold">Mission Control</Typography>
      </Box>

      {/* Metrics Bar */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={<PeopleIcon fontSize="small" />} 
              color="primary" 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard 
              title="Operators" 
              value={stats.totalOperators} 
              icon={<BusinessCenterIcon fontSize="small" />} 
              color="secondary" 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard 
              title="Venues" 
              value={`${stats.verifiedVenues}/${stats.totalVenues}`} 
              icon={<VerifiedUserIcon fontSize="small" />} 
              color="success" 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard 
              title="Active Events" 
              value={stats.totalEvents} 
              icon={<CalendarMonthIcon fontSize="small" />} 
              color="info" 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard 
              title="Action Items" 
              value={stats.openTickets} 
              icon={<ContactSupportIcon fontSize="small" />} 
              color="error" 
            />
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%', mb: 4, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PendingActionsIcon />} label="Verification Queue" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Audit Logs" iconPosition="start" />
          <Tab icon={<ContactSupportIcon />} label="Support Requests" iconPosition="start" />
          <Tab icon={<MonetizationOnIcon />} label="Subscriptions" iconPosition="start" />
          <Tab icon={<LayersIcon />} label="Discovery Heatmap" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="System Performance" iconPosition="start" disabled />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Pending Ownership Claims</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Review requests from users claiming to be venue owners.
                  </Typography>
                  
                  {claims.length === 0 ? (
                    <Alert severity="info">No claims to review at this time.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Venue</TableCell>
                            <TableCell>Requester</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {claims.map((claim) => (
                            <TableRow key={claim.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">{claim.venueName}</Typography>
                                <Typography variant="caption" color="text.secondary">ID: {claim.venueId}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{claim.username}</Typography>
                                <Typography variant="caption" color="text.secondary">{claim.email}</Typography>
                              </TableCell>
                              <TableCell>
                                {new Date(claim.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={claim.status} 
                                  size="small" 
                                  color={claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'error' : 'warning'} 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                {claim.status === 'PENDING' && (
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="success"
                                      onClick={() => handleUpdateClaim(claim.id, 'APPROVED')}
                                      disabled={actionLoading === claim.id}
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      color="error"
                                      onClick={() => handleUpdateClaim(claim.id, 'REJECTED')}
                                      disabled={actionLoading === claim.id}
                                    >
                                      Reject
                                    </Button>
                                  </Stack>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">System Activity Feed</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    The latest actions performed across the platform.
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Entity</TableCell>
                          <TableCell>Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {new Date(log.createdAt).toLocaleString(undefined, { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {log.username || 'System'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={log.action} 
                                size="small" 
                                sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} 
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ display: 'block' }}>{log.entityType}</Typography>
                              <Typography variant="caption" color="text.secondary">ID: {log.entityId}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ 
                                display: '-webkit-box', 
                                WebkitLineClamp: 1, 
                                WebkitBoxOrient: 'vertical', 
                                overflow: 'hidden' 
                              }}>
                                {JSON.stringify(log.details)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Support & Bug Reports</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Inquiries and issue reports from users and guests.
                  </Typography>

                  {tickets.length === 0 ? (
                    <Alert severity="info">No support tickets found.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Sender</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow key={ticket.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">{ticket.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{ticket.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">{ticket.subject}</Typography>
                                <Typography variant="caption" sx={{ 
                                  display: '-webkit-box', 
                                  WebkitLineClamp: 2, 
                                  WebkitBoxOrient: 'vertical', 
                                  overflow: 'hidden',
                                  color: 'text.secondary'
                                }}>
                                  {ticket.message}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={ticket.status} 
                                  size="small" 
                                  color={ticket.status === 'OPEN' ? 'error' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'success'} 
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <Select
                                    value={ticket.status}
                                    onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    <MenuItem value="OPEN">Open</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="CLOSED">Closed</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Active Subscriptions</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Venues currently on paid plans.
                  </Typography>

                  {subscriptions.length === 0 ? (
                    <Alert severity="info">No active subscriptions found.</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Venue</TableCell>
                            <TableCell>Owner</TableCell>
                            <TableCell>Tier</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subscriptions.map((sub) => (
                            <TableRow key={sub.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">{sub.name}</Typography>
                                <Typography variant="caption" color="text.secondary">ID: {sub.id}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{sub.ownerName}</Typography>
                                <Typography variant="caption" color="text.secondary">{sub.ownerEmail}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={sub.subscriptionTier.toUpperCase()} 
                                  size="small" 
                                  color="secondary" 
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={sub.subscriptionStatus.toUpperCase()} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tabValue === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Discovery Heatmap</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Visualizing search intensity across the platform. Use this to identify where new venues should be recruited.
                  </Typography>

                  <Box sx={{ height: 500, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <APIProvider apiKey={apiKey}>
                      <GoogleMap
                        defaultCenter={{ lat: 39.8283, lng: -98.5795 }} // Center of USA
                        defaultZoom={4}
                        mapId="ADMIN_HEATMAP"
                      >
                        {/* We would render the actual heatmap points here */}
                      </GoogleMap>
                    </APIProvider>
                  </Box>
                  
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Current search volume is being tracked from {heatmapData.length} unique discovery events.
                  </Alert>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
