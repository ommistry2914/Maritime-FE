export const routes = [
    {
        title:"Admin Management",
        url: "/admin-management",
        allowedRoles: ["superAdmin"],
    },
    {
        title:"Dashboard",
        url: "/adminDashboard",
        allowedRoles: ["admin"],
    },
    {
        title:"Crew Management",
        url: "/admin-management",
        allowedRoles: ["admin"],
    },
    {
        title:"Crew Dashboard",
        url: "/userDashboard",
        allowedRoles: ["crew", "user"],
    },
    {
        title:"Fleet Registry",
        url: "/ships",
        allowedRoles: ["admin"],
    },
    {
        title:"Maintenance",
        url: "/maintenance",
        allowedRoles: ["admin", "crew", "user"],
    },
    {
        title:"Safety Drills",
        url: "/drills",
        allowedRoles: ["admin", "crew", "user"],
    },
    {
        title:"Settings",
        url: "/setting",
        allowedRoles: ["superAdmin", "admin", "crew", "user"],
    }
]

export const temRoute = [ 
    {
        title:"Home",
        url: "/",
    },
    {
        title:"Setting",
        url:"/Setting",
    }
]
