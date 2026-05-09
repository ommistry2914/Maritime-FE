import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import SuperAdminHome from '@/pages/SuperAdmin/SuperAdminHome'
import { Route } from 'react-router-dom'
import Maintenance from '@/pages/Operations/Maintenance'
import Drills from '@/pages/Operations/Drills'
import Ships from '@/pages/Operations/Ships'
import AccountManagement from '@/pages/Operations/AccountManagement'

const AdminRoutes = () => (
    <Route element={<Layout/>}>
        <Route path='/adminDashboard' element={<SuperAdminHome/>}/>
        <Route path='/admin-management' element={<AccountManagement/>}/>
        <Route path='/ships' element={<Ships/>}/>
        <Route path='/maintenance' element={<Maintenance/>}/>
        <Route path='/drills' element={<Drills/>}/>
        <Route path='/setting' element={<Setting/>}/>
    </Route>
)

export default AdminRoutes
