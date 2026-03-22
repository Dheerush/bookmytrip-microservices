"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Plane, Hotel, Package, LogOut, LayoutGrid } from "lucide-react";
import Logo from "@/components/ui/Logo/Logo";
import { useAuth } from "@/services/auth/context";
import styles from "./Navbar.module.scss";

const TrainIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-4 0v2" />
    <path d="m8 12 2 2 4-4" />
  </svg>
);

const NAV_ITEMS = [
  { label: "Home",     href: "/",         icon: <Home    size={13} strokeWidth={1.8} /> },
  { label: "Flights",  href: "/flights",  icon: <Plane   size={13} strokeWidth={1.8} /> },
  { label: "Hotels",   href: "/hotels",   icon: <Hotel   size={13} strokeWidth={1.8} /> },
  { label: "Trains",   href: "/trains",   icon: <TrainIcon /> },
  { label: "Packages", href: "/packages", icon: <Package size={13} strokeWidth={1.8} /> },
];

const NavLink = ({
  item, index, active, transparent,
}: {
  item: (typeof NAV_ITEMS)[0]; index: number; active?: boolean; transparent: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href={item.href}
      className={`${styles.navLink} ${active ? styles.active : ""} ${transparent ? styles.onHero : ""}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + index * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.span className={styles.navIcon}
        animate={{ color: hovered ? "var(--sky)" : "currentColor", y: hovered ? -1 : 0 }}
        transition={{ duration: 0.22 }}>
        {item.icon}
      </motion.span>
      {item.label}
      <motion.span className={styles.underline}
        animate={{ scaleX: hovered || active ? 1 : 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }} />
    </motion.a>
  );
};

const ProfileDropdown = ({
  user,
  onDashboard,
  onLogout,
}: {
  user: { name: string; avatarUrl?: string };
  onDashboard: () => void;
  onLogout: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={styles.profileWrapper} ref={ref}>
      <motion.button className={styles.avatarBtn} onClick={() => setOpen(p => !p)}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <div className={styles.avatarRing}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} /> // eslint-disable-line @next/next/no-img-element
            : <span className={styles.avatarInitial}>{user.name[0]}</span>}
          <span className={styles.onlineDot} />
        </div>
        <span className={styles.avatarName}>{user.name}</span>
        <motion.span className={styles.chevron} animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.28 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.dropdown}
            initial={{ opacity: 0, y: 7, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 7, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className={styles.dropdownUser}>
              <div className={styles.dropdownName}>{user.name}</div>
              <div className={styles.dropdownTag}>✦ Gold Member</div>
            </div>
            <motion.button className={styles.dropdownItem}
              onClick={() => { setOpen(false); onDashboard(); }}
              whileHover={{ paddingLeft: "18px" }} transition={{ duration: 0.14 }}>
              <LayoutGrid size={13} strokeWidth={1.8} />My Dashboard
            </motion.button>
            <div className={styles.dropdownSep} />
            <motion.button className={`${styles.dropdownItem} ${styles.danger}`}
              onClick={() => { setOpen(false); onLogout(); }}
              whileHover={{ paddingLeft: "18px" }} transition={{ duration: 0.14 }}>
              <LogOut size={13} strokeWidth={1.8} />Log Out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Navbar() {
  const { user, isAuthenticated, hydrated, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = !scrolled;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";

  return (
    <>
      <motion.nav
        className={`${styles.navbar} ${scrolled ? styles.scrolled : styles.transparent}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <Logo variant={transparent ? "light" : "dark"} />

        <ul className={styles.navLinks}>
          {NAV_ITEMS.map((item, i) => (
            <li key={item.label}>
              <NavLink item={item} index={i} active={i === 0} transparent={transparent} />
            </li>
          ))}
        </ul>

        <motion.div className={styles.navRight}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className={`${styles.divider} ${transparent ? styles.dividerLight : ""}`} />
          {hydrated && isAuthenticated ? (
            <ProfileDropdown
              user={{ name: displayName, avatarUrl: user?.avatarUrl }}
              onDashboard={handleDashboard}
              onLogout={handleLogout}
            />
          ) : (
            <motion.a href="/login"
              className={`${styles.loginBtn} ${transparent ? styles.loginBtnLight : ""}`}
              whileHover="hover" initial="rest" animate="rest">
              <motion.span className={styles.loginFill}
                variants={{ rest: { x: "-105%" }, hover: { x: "0%" } }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }} />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" style={{ position: "relative", zIndex: 1 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ position: "relative", zIndex: 1 }}>Sign In</span>
            </motion.a>
          )}
        </motion.div>

        <button className={`${styles.hamburger} ${transparent ? styles.hamburgerLight : ""}`}
          onClick={() => setMobileOpen(p => !p)} aria-label="Toggle menu">
          <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6 : 0 }} />
          <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} />
          <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6 : 0 }} />
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className={styles.mobileMenu}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {NAV_ITEMS.map((item, i) => (
              <motion.a key={item.label} href={item.href} className={styles.mobileLink}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }} onClick={() => setMobileOpen(false)}>
                {item.icon}{item.label}
              </motion.a>
            ))}
            {hydrated && isAuthenticated ? (
              <>
                <motion.button className={styles.mobileLink}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  onClick={() => { setMobileOpen(false); handleDashboard(); }}
                  style={{ border: "none", background: "transparent", width: "100%", textAlign: "left" }}>
                  <LayoutGrid size={13} strokeWidth={1.8} />My Dashboard
                </motion.button>
                <motion.button className={styles.mobileLogin}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  style={{ border: "none" }}>
                  <LogOut size={13} strokeWidth={1.8} style={{ marginRight: 8 }} />Log Out
                </motion.button>
              </>
            ) : (
              <motion.a href="/login" className={styles.mobileLogin}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Sign In
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}