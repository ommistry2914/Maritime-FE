import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import SuperAdminSetting from '@/pages/SuperAdmin/SuperAdminSetting'
import { Route } from 'react-router-dom'
import AccountManagement from '@/pages/Operations/AccountManagement'

const SuperAdminRoutes = () => (
    <Route element={<Layout/>}>
        <Route path='/admin-management' element={<AccountManagement/>}/>
        <Route path='/setting' element={<Setting/>}/>
        <Route path='/superAdminSetting' element={<SuperAdminSetting/>}/>
    </Route>
)

export default SuperAdminRoutes
