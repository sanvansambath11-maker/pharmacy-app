'use client';

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';
import { useTheme } from 'next-themes';
import { translations } from './lib/translations';
import {
  Search, User, Heart, ShoppingCart, Upload, Globe, Menu, X,
  Home, Grid3X3, ChevronRight, ChevronDown, Quote,
  ShoppingBag, SlidersHorizontal, Minus, Plus, MessageCircle,
  Truck, Shield, RefreshCw, Lock, BadgeCheck, Headphones,
  Calendar, UserCheck, CreditCard, Package, CheckCircle,
  Clock, AlertCircle, FileText, Bell, MapPin, Settings,
  HelpCircle, Camera, Phone, Mail, Facebook, Twitter,
  Instagram, Linkedin, Star, Users, Zap, Sun, Wind, Moon,
  Gift, Percent, Tag, Copy, ArrowRight, Sparkles,
  HeartHandshake, BookOpen, Stethoscope, Award, Info,
  LogOut, Eye, EyeOff, UserPlus, BarChart3, TrendingUp,
  Trash2, Edit, ShieldCheck, LayoutDashboard
} from 'lucide-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { supabase } from './lib/supabase';
import { generateKHQR, formatKHR, USD_TO_KHR } from './lib/khqr';
import { QRCodeSVG } from 'qrcode.react';
import {
  categories, products as initialProducts, featuredServices, trustBadges,
  howItWorks, faqs, testimonials, healthTips, seasonalAlerts,
  journeyMilestones, coreValues, impactStats, teamMembers,
  offers, subscriptionPlans, dealOfTheDay
} from './lib/pharmacyData';

// ============ ICON MAP ============
const ICON_MAP = {
  RefreshCw, Upload, MessageCircle, Calendar, Shield,
  Headphones, Lock, Truck, BadgeCheck, Search,
  UserCheck, CreditCard, Package, Heart, Star,
  Users, Zap, Sun, Wind, Clock,
};

// ============ ADMIN EMAILS CONFIG ============
// Add your admin email addresses here. Only these users can access the Admin Dashboard.
const ADMIN_EMAILS = [
  'admin@battopharmacy.com',
  'sanvansambath222@gmail.com',
];

function checkIsAdmin(user) {
  if (!user) return false;
  // Check if user email is in admin list
  if (ADMIN_EMAILS.includes(user.email?.toLowerCase())) return true;
  // Also check user metadata role (set via Supabase dashboard)
  if (user.user_metadata?.role === 'admin') return true;
  return false;
}

// ============ LANGUAGE CONTEXT ============
const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });
function useLang() { return useContext(LangContext); }

// ============ PRODUCTS CONTEXT ============
const ProductsContext = createContext({ products: [], addProduct: () => {}, updateProduct: () => {}, deleteProduct: () => {} });
function useProducts() { return useContext(ProductsContext); }

// ============ PERSISTENT STATE HOOK ============
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(defaultValue);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setState(JSON.parse(stored));
    } catch {}
  }, [key]);
  const setPersistentState = useCallback((val) => {
    setState(val);
    try { localStorage.setItem(key, JSON.stringify(typeof val === 'function' ? val(state) : val)); } catch {}
  }, [key, state]);
  return [state, setPersistentState];
}

// ============ NAV LINK HELPER ============
function NavLink({ onClick, children, className }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={className}>
      {children}
    </a>
  );
}

// ============ HEADER ============
function Header({ navigate, cartCount, currentPage, user, onLogout, wishlistCount, isAdmin }) {
  const { products } = useProducts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchResults = searchQuery.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const navLinks = [
    { page: 'home', label: t('home') },
    { page: 'about', label: t('aboutUs') },
    { page: 'offers', label: t('offers') },
    { page: 'contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <NavLink onClick={() => navigate('home')} className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.png" alt="Batto Pharmacy Logo" className="w-12 h-12 object-contain hidden sm:block" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl hidden items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-xl">BP</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-gray-900 dark:text-white leading-tight">Batto Pharmacy</div>
              <div className="text-xs text-teal-600 font-medium">Caring for your health</div>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink key={link.page} onClick={() => navigate(link.page)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === link.page ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} placeholder={t('searchPlaceholder')} className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm dark:text-white" />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                {searchResults.map(p => (
                  <button key={p.id} onMouseDown={() => { navigate('product', { productId: p.id }); setSearchQuery(''); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.brand} · ${p.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Dark Mode Toggle */}
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            )}

            {/* Language Toggle */}
            <button onClick={() => setLang(lang === 'en' ? 'km' : 'en')} className="flex items-center gap-1 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium text-gray-600 dark:text-gray-300">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">{t('language')}</span>
            </button>

            {/* Wishlist */}
            <NavLink onClick={() => navigate('wishlist')} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative hidden sm:block">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
            </NavLink>

            <NavLink onClick={() => navigate('prescription')} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all text-sm font-semibold">
              <Upload className="w-4 h-4" /><span>{t('uploadRx')}</span>
            </NavLink>

            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <NavLink onClick={() => { navigate('account'); setShowUserMenu(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full">
                      <User className="w-4 h-4" />My Account
                    </NavLink>
                    <NavLink onClick={() => { navigate('checkout'); setShowUserMenu(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full">
                      <Package className="w-4 h-4" />My Orders
                    </NavLink>
                    {isAdmin && (
                    <NavLink onClick={() => { navigate('admin'); setShowUserMenu(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors w-full">
                      <LayoutDashboard className="w-4 h-4" />Admin Dashboard
                    </NavLink>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { onLogout(); setShowUserMenu(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                        <LogOut className="w-4 h-4" />Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <NavLink onClick={() => navigate('login')} className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-all hidden sm:block">
                  Sign In
                </NavLink>
                <NavLink onClick={() => navigate('signup')} className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all hidden sm:block">
                  Sign Up
                </NavLink>
                <NavLink onClick={() => navigate('login')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors sm:hidden">
                  <User className="w-5 h-5 text-gray-600" />
                </NavLink>
              </div>
            )}

            <NavLink onClick={() => navigate('checkout')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
            </NavLink>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input type="text" placeholder="Search medicines..." className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
        </div>
      </div>

      {/* Category Nav */}
      <div className="hidden lg:block border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 py-2.5 overflow-x-auto">
            {categories.map(cat => (
              <NavLink key={cat.id} onClick={() => navigate('category', { categoryId: cat.id })} className="text-sm text-gray-600 hover:text-teal-600 whitespace-nowrap transition-colors font-medium">{cat.name}</NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(link => (
              <NavLink key={link.page} onClick={() => { navigate(link.page); setMobileMenuOpen(false); }} className={`block px-4 py-3 rounded-lg font-medium ${currentPage === link.page ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}>{link.label}</NavLink>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {categories.slice(0, 5).map(cat => (
                <NavLink key={cat.id} onClick={() => { navigate('category', { categoryId: cat.id }); setMobileMenuOpen(false); }} className="block px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">{cat.name}</NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ============ TRUST BAR ============
function TrustBar() {
  return (
    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4 overflow-x-auto">
          {trustBadges.map((badge, index) => {
            const IconComp = ICON_MAP[badge.icon];
            return (
              <div key={index} className="flex items-center gap-2 text-sm text-teal-700 whitespace-nowrap">
                {IconComp && <IconComp className="w-4 h-4 text-teal-500" />}
                <span className="hidden sm:inline font-medium">{badge.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ FOOTER ============
function Footer({ navigate }) {
  return (
    <footer className="bg-gray-900 text-gray-300 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-6">
                <img src="/logo.png" alt="Batto Pharmacy Logo" className="w-10 h-10 object-contain hidden sm:block" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-xl hidden items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">BP</span>
                </div>
                <div className="font-bold text-white text-lg">Batto Pharmacy</div>
              </div>
            <p className="text-sm mb-5 leading-relaxed text-gray-400">Your trusted global pharmacy partner. Licensed, verified, and committed to your health and wellbeing.</p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-gray-800 hover:bg-teal-500 rounded-xl flex items-center justify-center transition-all hover:scale-105">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-5 text-lg">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              {[{ label: 'Home', page: 'home' }, { label: 'About Us', page: 'about' }, { label: 'Offers & Deals', page: 'offers' }, { label: 'Upload Prescription', page: 'prescription' }, { label: 'Contact Us', page: 'contact' }].map(item => (
                <li key={item.label}><NavLink onClick={() => navigate(item.page)} className="hover:text-teal-400 transition-colors">{item.label}</NavLink></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-5 text-lg">Customer Care</h3>
            <ul className="space-y-3 text-sm">
              {['My Account', 'Track Order', 'Returns & Refunds', 'FAQs', 'Pharmacist Support'].map(item => (
                <li key={item}><NavLink onClick={() => navigate('contact')} className="hover:text-teal-400 transition-colors">{item}</NavLink></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-5 text-lg">Contact</h3>
            <ul className="space-y-4 text-sm text-teal-100/70">
              <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-teal-400" /><div>No 123, Monivong Blvd, Phnom Penh</div></li>
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-teal-400" /><div>+855 23 456 789</div></li>
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-teal-400" /><div>support@battopharmacy.com</div></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>2026 Batto Pharmacy. All rights reserved. Made with <Heart className="w-3 h-3 inline text-rose-400 fill-rose-400" /> for your health.</div>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="hover:text-teal-400 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============ MOBILE BOTTOM NAV ============
function MobileBottomNav({ currentPage, navigate }) {
  const navItems = [
    { page: 'home', icon: Home, label: 'Home' },
    { page: 'offers', icon: Tag, label: 'Offers' },
    { page: 'checkout', icon: ShoppingCart, label: 'Cart' },
    { page: 'account', icon: User, label: 'Account' },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.page;
          return (
            <NavLink key={item.page} onClick={() => navigate(item.page, item.params)} className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ============ PRODUCT CARD ============
function ProductCard({ product, navigate, onAddToCart }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
      <NavLink onClick={() => navigate('product', { productId: product.id })} className="block relative">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        {product.discount && <div className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg">-{product.discount}%</div>}
        {product.prescriptionRequired && <div className="absolute top-3 right-3 px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg">Rx</div>}
      </NavLink>
      <div className="p-4">
        <div className="text-xs text-teal-600 font-medium mb-1">{product.brand}</div>
        <NavLink onClick={() => navigate('product', { productId: product.id })}><h3 className="font-semibold text-gray-900 mb-1.5 hover:text-teal-600 transition-colors line-clamp-2 text-sm">{product.name}</h3></NavLink>
        {product.rating && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}</div>
            <span className="text-xs text-gray-500">({product.reviews})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <div className="font-bold text-lg text-gray-900">${product.price}</div>
          {product.originalPrice && <div className="text-sm text-gray-400 line-through">${product.originalPrice}</div>}
        </div>
        <button disabled={!product.inStock} onClick={(e) => { e.preventDefault(); onAddToCart(product); }} className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold">
          <ShoppingCart className="w-4 h-4" />Add to Cart
        </button>
      </div>
    </div>
  );
}

// ============ CATEGORY CARD ============
function CategoryCard({ category, navigate }) {
  return (
    <NavLink onClick={() => navigate('category', { categoryId: category.id })} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all block">
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
        <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-4 text-center">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors text-sm">{category.name}</h3>
        <p className="text-xs text-gray-500">{category.productCount} products</p>
      </div>
    </NavLink>
  );
}

// ============ HOME PAGE (WARM & CARING) ============
function HomePage({ navigate, onAddToCart }) {
  const { products } = useProducts();
  const bestSellers = products.slice(0, 4);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white">
      {/* Seasonal Alert Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-amber-800 font-medium">{seasonalAlerts[0].title}: {seasonalAlerts[0].message}</span>
          <NavLink onClick={() => navigate('offers')} className="text-amber-600 font-bold hover:underline ml-2">Shop Now &rarr;</NavLink>
        </div>
      </div>

      {/* Hero - Video Background */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://customer-assets.emergentagent.com/job_zip-validator-4/artifacts/5zk9b3t3_kling_20260312_VIDEO___15s_Sce_5867_0.mp4"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/40 via-teal-900/50 to-teal-900/70"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full text-sm text-white font-medium mb-6 shadow-sm border border-white/20">
              <HeartHandshake className="w-4 h-4 text-rose-300" /> Trusted by 50,000+ families
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">
              Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">Our Priority</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow">
              More than a pharmacy. We are your caring health partner — delivering quality medicines with warmth, expertise, and a personal touch.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink onClick={() => navigate('prescription')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 text-lg border border-teal-400/30">
                <Upload className="w-5 h-5" />Upload Prescription
              </NavLink>
              <NavLink onClick={() => navigate('category', { categoryId: 'vitamins' })} className="w-full sm:w-auto px-8 py-4 bg-white/15 backdrop-blur-md text-white rounded-2xl font-semibold border border-white/30 hover:bg-white/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5" />Shop Products
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-teal-100 relative overflow-hidden">
            <Quote className="absolute top-6 left-6 w-12 h-12 text-teal-200" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <img src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].name} className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</h3>
                  <p className="text-sm text-teal-600">{testimonials[currentTestimonial].location}</p>
                </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4 italic">&ldquo;{testimonials[currentTestimonial].text}&rdquo;</p>
              <div className="flex justify-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentTestimonial ? 'bg-teal-500 w-8' : 'bg-teal-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Find the right products for your health needs. From vitamins to skincare, we have it all.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map(cat => <CategoryCard key={cat.id} category={cat} navigate={navigate} />)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple as 1-2-3-4</h2>
            <p className="text-gray-500">Getting your medicines delivered has never been easier</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map(step => {
              const IconComp = ICON_MAP[step.icon];
              return (
                <div key={step.step} className="text-center relative group">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/10 group-hover:shadow-xl group-hover:shadow-teal-500/20 transition-all border border-teal-100">
                    {IconComp && <IconComp className="w-9 h-9 text-teal-600" />}
                  </div>
                  <div className="absolute -top-2 left-1/2 ml-7 w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">{step.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Best Sellers</h2>
              <p className="text-gray-500">Loved and trusted by our community</p>
            </div>
            <NavLink onClick={() => navigate('category', { categoryId: 'vitamins' })} className="hidden sm:flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold group">
              View All<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </NavLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart} />)}
          </div>
        </div>
      </section>

      {/* Health Tips Blog Preview */}
      <section className="py-16 bg-gradient-to-br from-rose-50/50 to-amber-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 rounded-full text-sm text-rose-700 font-medium mb-4">
              <BookOpen className="w-4 h-4" /> Health & Wellness Blog
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Health Tips for You</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Stay informed with expert advice from our licensed pharmacists</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthTips.map(tip => (
              <div key={tip.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group cursor-pointer">
                <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                  <img src={tip.image} alt={tip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-lg">{tip.category}</span>
                    <span className="text-xs text-gray-400">{tip.readTime} read</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{tip.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{tip.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* First Order Discount CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-white text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" /> New Customer Offer
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Get 20% Off Your First Order</h2>
                <p className="text-teal-100 mb-6 text-lg">Join 50,000+ families who trust Batto Pharmacy. Use code <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded">WELCOME20</span></p>
                <NavLink onClick={() => navigate('offers')} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-2xl font-bold hover:shadow-xl transition-all text-lg">
                  <Gift className="w-5 h-5" />Claim Offer
                </NavLink>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="w-36 h-36 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-6xl font-black text-white">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Common Questions</h2>
            <p className="text-gray-500">We are here to help at every step</p>
          </div>
          <AccordionPrimitive.Root type="single" collapsible className="space-y-3">
            {faqs.slice(0, 5).map((faq, index) => (
              <AccordionPrimitive.Item key={index} value={`item-${index}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                    {faq.question}
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.answer}</AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>
      </section>
    </div>
  );
}

// ============ ABOUT PAGE ============
function AboutPage({ navigate }) {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-600 to-emerald-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            <HeartHandshake className="w-4 h-4" /> Our Story
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">More Than a Pharmacy.<br /><span className="text-teal-200">A Caring Partner.</span></h1>
          <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto leading-relaxed">Founded on the belief that everyone deserves accessible, affordable, and compassionate healthcare.</p>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Journey</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From a small idea to serving 50,000+ families — here is how we grew</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 via-teal-400 to-emerald-400"></div>
            {journeyMilestones.map((milestone, i) => (
              <div key={i} className={`relative flex items-start gap-6 mb-12 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'} pl-16 md:pl-0`}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl transition-all">
                    <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{milestone.year}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-3 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
                <div className="absolute left-5 md:left-1/2 md:-translate-x-1/2 w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1 hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Stand For</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Our core values guide every decision we make</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, i) => {
              const IconComp = ICON_MAP[value.icon];
              return (
                <div key={i} className="bg-white rounded-2xl p-7 border border-teal-100 hover:shadow-xl hover:shadow-teal-100/50 transition-all text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform border border-teal-100">
                    {IconComp && <IconComp className="w-8 h-8 text-teal-600" />}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{value.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, i) => {
              const IconComp = ICON_MAP[stat.icon];
              return (
                <div key={i} className="text-center p-6 bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-2xl border border-gray-100">
                  {IconComp && <IconComp className="w-8 h-8 text-teal-500 mx-auto mb-3" />}
                  <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Meet Our Care Team</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The dedicated professionals behind your health journey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg shadow-gray-100/50 text-center hover:shadow-xl transition-all group">
                <img src={member.avatar} alt={member.name} className="w-28 h-28 rounded-full object-cover mx-auto mb-5 border-4 border-teal-100 group-hover:border-teal-300 transition-colors" />
                <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                <p className="text-teal-600 font-medium text-sm mb-1">{member.role}</p>
                <p className="text-gray-400 text-xs mb-4">{member.specialty}</p>
                <p className="text-gray-600 italic text-sm">&ldquo;{member.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-teal-500 to-emerald-500">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <HeartHandshake className="w-12 h-12 mx-auto mb-4 text-teal-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Caring Community</h2>
          <p className="text-lg text-teal-100 mb-8 max-w-xl mx-auto">Experience healthcare the way it should be — personal, affordable, and always there when you need it.</p>
          <NavLink onClick={() => navigate('offers')} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-2xl font-bold hover:shadow-xl transition-all text-lg">
            <Gift className="w-5 h-5" />Get Started with 20% Off
          </NavLink>
        </div>
      </section>
    </div>
  );
}

// ============ CONTACT PAGE ============
function ContactPage({ navigate }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const contactChannels = [
    { icon: MessageCircle, title: 'Live Chat', description: 'Chat with our pharmacist', availability: 'Available 24/7', action: 'Start Chat', bgColor: 'bg-teal-50', textColor: 'text-teal-600', borderColor: 'border-teal-100', online: true },
    { icon: Phone, title: 'Phone', description: '+855 23 456 789', availability: 'Mon-Sun, 24/7', action: 'Call Now', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-100', online: true },
    { icon: Mail, title: 'Email', description: 'support@battopharmacy.com', availability: 'Reply within 2 hours', action: 'Send Email', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-100', online: true },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-teal-700 font-medium mb-6 shadow-sm border border-teal-100">
            <Stethoscope className="w-4 h-4" /> We are here for you
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How Can We Help?</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">Our caring team is always ready to assist you. Reach out anytime — your health questions matter to us.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Contact Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {contactChannels.map(channel => {
            const Icon = channel.icon;
            return (
              <div key={channel.title} className={`${channel.bgColor} border ${channel.borderColor} rounded-2xl p-7 hover:shadow-xl transition-all relative overflow-hidden`}>
                {channel.online && <div className="absolute top-4 right-4 flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-xs text-green-600 font-medium">Online</span></div>}
                <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                  <Icon className={`w-7 h-7 ${channel.textColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{channel.title}</h3>
                <p className="text-gray-600 mb-1">{channel.description}</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5"><Clock className="w-3.5 h-3.5" />{channel.availability}</div>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all">{channel.action}</button>
              </div>
            );
          })}
        </div>

        {/* Contact Form + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-16">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-lg shadow-gray-100/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 mb-6">Fill out the form and our team will get back to you within 2 hours.</p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label><input type="text" placeholder="John Doe" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label><input type="email" placeholder="john@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" /></div>
                </div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label><input type="text" placeholder="How can we help?" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Message</label><textarea rows={5} placeholder="Tell us more about your question or concern..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 resize-none" /></div>
                <button onClick={() => toast.success('Message sent! We will respond within 2 hours.')} className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all text-lg">Send Message</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-7 border border-teal-100">
              <MapPin className="w-8 h-8 text-teal-500 mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-3">Visit Us</h3>
              <p className="text-gray-600 leading-relaxed">No 123, Monivong Blvd<br />Section 1<br />Phnom Penh, Cambodia</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-7 border border-blue-100">
              <Clock className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-3">Business Hours</h3>
              <div className="text-gray-600 space-y-2 text-sm">
                <div className="flex justify-between"><span>Monday - Friday</span><span className="font-semibold text-gray-900">8AM - 8PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="font-semibold text-gray-900">9AM - 6PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="font-semibold text-gray-900">10AM - 4PM</span></div>
              </div>
              <p className="text-xs text-blue-600 mt-3 font-medium">* Pharmacist hotline available 24/7</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-7 border border-rose-100">
              <HeartHandshake className="w-8 h-8 text-rose-500 mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-3">Pharmacist Advice</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Need help with your medication? Our licensed pharmacists are available 24/7 for free consultations.</p>
              <button className="w-full px-4 py-2.5 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors text-sm">Talk to a Pharmacist</button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <AccordionPrimitive.Root type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionPrimitive.Item key={i} value={`faq-${i}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <AccordionPrimitive.Header><AccordionPrimitive.Trigger className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 flex items-center justify-between group transition-colors">{faq.question}<ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.answer}</AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ OFFERS PAGE ============
function OffersPage({ navigate }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 8, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.success(`Code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="w-4 h-4" /> Exclusive Deals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Save More, Live Healthier</h1>
          <p className="text-lg text-rose-100 max-w-xl mx-auto">Special offers for our community. Because caring for your health should not break the bank.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Deal of the Day */}
        <div className="mb-14">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 md:p-10 border border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-white rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                <img src={dealOfTheDay.product.image} alt={dealOfTheDay.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-sm text-amber-700 font-bold mb-3"><Clock className="w-3.5 h-3.5" /> Deal of the Day</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{dealOfTheDay.product.name}</h3>
                <p className="text-gray-600 mb-3">{dealOfTheDay.product.brand}</p>
                <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                  <span className="text-3xl font-black text-rose-600">${dealOfTheDay.specialPrice}</span>
                  <span className="text-lg text-gray-400 line-through">${dealOfTheDay.product.originalPrice}</span>
                  <span className="px-2 py-1 bg-rose-500 text-white text-sm font-bold rounded-lg">-{dealOfTheDay.discount}%</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <p className="text-sm text-amber-700 font-semibold mb-2">Ends in</p>
                <div className="flex gap-2">
                  {[{ val: countdown.hours, label: 'HRS' }, { val: countdown.minutes, label: 'MIN' }, { val: countdown.seconds, label: 'SEC' }].map((t, i) => (
                    <div key={i} className="bg-gray-900 text-white rounded-xl px-3 py-2 min-w-[56px]">
                      <div className="text-2xl font-bold font-mono">{String(t.val).padStart(2, '0')}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{t.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { navigate('product', { productId: '5' }); }} className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all">Grab Deal</button>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Cards */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Current Promotions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map(offer => (
              <div key={offer.id} className={`bg-gradient-to-br ${offer.color} rounded-2xl p-7 text-white relative overflow-hidden group hover:shadow-2xl transition-all`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-3">{offer.subtitle}</span>
                  <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">{offer.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-black">{offer.discount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1">
                      <Tag className="w-4 h-4" />
                      <span className="font-mono font-bold tracking-wider">{offer.code}</span>
                    </div>
                    {offer.code !== 'Unique link' && (
                      <button onClick={() => copyCode(offer.code)} className="px-4 py-2.5 bg-white/25 hover:bg-white/35 rounded-xl transition-colors font-semibold text-sm flex items-center gap-1.5">
                        {copiedCode === offer.code ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedCode === offer.code ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mt-3">Valid until: {offer.validUntil}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-14">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 font-medium mb-4"><RefreshCw className="w-4 h-4" /> Auto-Refill Savings</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Subscribe & Save</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Never run out of your medications. Choose a plan and save on every refill.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {subscriptionPlans.map(plan => (
              <div key={plan.id} className={`rounded-2xl p-7 border-2 relative ${plan.popular ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-xl shadow-teal-100/50' : 'border-gray-100 bg-white hover:border-gray-200'} transition-all`}>
                {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">MOST POPULAR</div>}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black text-teal-600">{plan.savings}</span>
                  <span className="text-gray-500 text-sm">savings on every order</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4.5 h-4.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-teal-500/25' : 'border-2 border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-600'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative max-w-2xl mx-auto">
            <Gift className="w-14 h-14 mx-auto mb-5 text-amber-200" />
            <h2 className="text-3xl font-bold mb-3">Share the Care, Earn Rewards</h2>
            <p className="text-amber-100 text-lg mb-6">Refer a friend and you both get $10 off. Because good health is better when shared.</p>
            <button className="px-8 py-4 bg-white text-amber-600 rounded-2xl font-bold hover:shadow-xl transition-all text-lg">Get Your Referral Link</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CATEGORY PAGE ============
function CategoryPage({ categoryId, navigate, onAddToCart }) {
  const { products } = useProducts();
  const category = categories.find(c => c.id === categoryId);
  const categoryProducts = products.filter(p => p.category === categoryId);
  if (!category) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">Category not found</h1></div>;
  return (
    <div className="bg-white min-h-screen">
      <div className="relative h-56 bg-gradient-to-br from-teal-50 to-emerald-50 overflow-hidden">
        <div className="absolute inset-0 opacity-15"><img src={category.image} alt={category.name} className="w-full h-full object-cover" /></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{category.name}</h1>
          <p className="text-lg text-gray-600">{category.productCount} quality products</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryProducts.map(p => <ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart} />)}
          </div>
        ) : (
          <div className="text-center py-16"><Package className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3></div>
        )}
      </div>
    </div>
  );
}

// ============ PRODUCT DETAIL PAGE ============
function ProductDetailPage({ productId, navigate, onAddToCart }) {
  const { products } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const product = products.find(p => p.id === productId);
  const relatedProducts = products.filter(p => p.id !== productId && p.category === product?.category).slice(0, 4);
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Product not found</h1></div>;
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <NavLink onClick={() => navigate('home')} className="hover:text-teal-600">Home</NavLink><ChevronRight className="w-3.5 h-3.5" />
          <NavLink onClick={() => navigate('category', { categoryId: product.category })} className="hover:text-teal-600 capitalize">{product.category}</NavLink><ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div><div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden"><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div></div>
          <div>
            <span className="text-sm text-teal-600 font-medium">{product.brand}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1 mb-4">{product.name}</h1>
            {product.rating && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}</div>
                <span className="font-bold text-gray-900">{product.rating}</span>
                <span className="text-gray-500">({product.reviews} reviews)</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.prescriptionRequired ? <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100">Rx Required</span> : <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-100">OTC</span>}
              <span className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm font-semibold rounded-lg border border-teal-100">Verified</span>
            </div>
            {product.strength && <div className="mb-5 text-gray-600">{product.strength} &middot; {product.packSize}</div>}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-black text-gray-900">${product.price}</span>
                {product.originalPrice && <><span className="text-xl text-gray-400 line-through">${product.originalPrice}</span><span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-sm font-bold rounded-lg border border-rose-100">Save {product.discount}%</span></>}
              </div>
              <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-600 font-medium">Qty:</span>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
              <div className="w-14 h-10 border border-gray-200 rounded-xl flex items-center justify-center font-bold">{quantity}</div>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
            </div>
            <button disabled={!product.inStock} onClick={() => onAddToCart(product, quantity)} className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" />Add to Cart
            </button>
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: <Truck className="w-5 h-5 text-teal-600" />, text: 'Fast Delivery' }, { icon: <Shield className="w-5 h-5 text-teal-600" />, text: 'Verified' }, { icon: <RefreshCw className="w-5 h-5 text-teal-600" />, text: 'Auto-Refill' }].map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl text-center"><div className="flex justify-center mb-1">{item.icon}</div><div className="text-xs text-gray-600 font-medium">{item.text}</div></div>
              ))}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <TabsPrimitive.Root defaultValue="overview" className="mb-16">
          <TabsPrimitive.List className="flex border-b border-gray-200 mb-6"><TabsPrimitive.Trigger value="overview" className="px-5 py-3 font-semibold text-gray-500 border-b-2 border-transparent data-[state=active]:text-teal-600 data-[state=active]:border-teal-600 transition-colors">Overview</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="ingredients" className="px-5 py-3 font-semibold text-gray-500 border-b-2 border-transparent data-[state=active]:text-teal-600 data-[state=active]:border-teal-600 transition-colors">Ingredients</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="usage" className="px-5 py-3 font-semibold text-gray-500 border-b-2 border-transparent data-[state=active]:text-teal-600 data-[state=active]:border-teal-600 transition-colors">Usage</TabsPrimitive.Trigger></TabsPrimitive.List>
          <TabsPrimitive.Content value="overview" className="py-4"><p className="text-gray-700 leading-relaxed">{product.description}</p></TabsPrimitive.Content>
          <TabsPrimitive.Content value="ingredients" className="py-4"><ul className="space-y-2">{(product.ingredients || []).map((ing, i) => <li key={i} className="flex items-center gap-2 text-gray-700"><CheckCircle className="w-4 h-4 text-teal-500" />{ing}</li>)}</ul></TabsPrimitive.Content>
          <TabsPrimitive.Content value="usage" className="py-4"><p className="text-gray-700 leading-relaxed">{product.usage}</p><div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-sm text-amber-800"><strong>Note:</strong> {product.warnings}</p></div></TabsPrimitive.Content>
        </TabsPrimitive.Root>
        {relatedProducts.length > 0 && (
          <div><h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{relatedProducts.map(rp => <ProductCard key={rp.id} product={rp} navigate={navigate} onAddToCart={onAddToCart} />)}</div></div>
        )}
      </div>
    </div>
  );
}

// ============ CHECKOUT PAGE WITH KHQR PAYMENT ============
function CheckoutPage({ cartItems, onRemoveFromCart, navigate, onPlaceOrder, user }) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [currency, setCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentProof, setPaymentProof] = useState('');

  const [frozenOrder, setFrozenOrder] = useState(null);
  const [orderNumber] = useState(`GRX-${Date.now().toString().slice(-6)}`);

  const currentCart = frozenOrder ? frozenOrder.cartItems : cartItems;
  const subtotal = currentCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = currentCart.length > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const totalUSD = subtotal + tax + shipping;
  const totalKHR = Math.round(totalUSD * USD_TO_KHR);
  const displayTotal = currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `${totalKHR.toLocaleString()} KHR`;

  const khqrPayload = generateKHQR({
    amount: currency === 'USD' ? totalUSD : totalKHR,
    currency,
    billNumber: orderNumber,
    storeLabel: 'Batto Pharmacy',
    terminalLabel: 'Web',
  });

  const simulatePayment = () => {
    if (!paymentProof && paymentMethod !== 'cod') {
      toast.error('Please upload payment receipt first.');
      return;
    }
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      setFrozenOrder({ cartItems });
      setStep(4);
      if (onPlaceOrder) {
        onPlaceOrder(cartItems, totalUSD, paymentMethod === 'khqr' ? 'KHQR (Bakong)' : paymentMethod === 'aba' ? 'ABA PayWay' : 'Cash on Delivery', {
          orderNumber,
          subtotal,
          shipping,
          tax,
          currency,
          userEmail: user?.email,
          paymentProof,
        });
      }
      toast.success('Payment received!', { description: `Order ${orderNumber} confirmed` });
    }, 3000);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[{ n: 1, label: 'Cart' }, { n: 2, label: 'Delivery' }, { n: 3, label: 'Payment' }, { n: 4, label: 'Done' }].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{step > s.n ? <CheckCircle className="w-5 h-5" /> : s.n}</div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${step >= s.n ? 'text-teal-700' : 'text-gray-400'}`}>{s.label}</span>
              {i < 3 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > s.n ? 'bg-teal-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Cart */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-5">Your Cart ({cartItems.length})</h2>
                {cartItems.length === 0 ? (
                  <div className="text-center py-12"><ShoppingCart className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Your cart is empty</p><button onClick={() => navigate('home')} className="mt-4 text-teal-600 font-semibold hover:underline">Continue Shopping</button></div>
                ) : (
                  <div className="space-y-4">{cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                      <div className="flex-1"><h3 className="font-semibold text-gray-900">{item.name}</h3><p className="text-sm text-gray-500">{item.brand} &middot; Qty: {item.quantity}</p><p className="font-bold text-gray-900 mt-1">${(item.price * item.quantity).toFixed(2)}</p></div>
                      <button onClick={() => onRemoveFromCart(item.id)} className="text-gray-400 hover:text-red-500 self-start"><X className="w-5 h-5" /></button>
                    </div>
                  ))}</div>
                )}
                <button disabled={cartItems.length === 0} onClick={() => setStep(2)} className="w-full mt-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold disabled:opacity-50 hover:shadow-lg transition-all">Continue to Delivery</button>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-5">Delivery Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label><input type="text" placeholder="Sok Dara" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label><input type="tel" placeholder="+855 12 345 678" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" /></div>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label><input type="text" placeholder="Street 123, Sangkat BKK1" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label><input type="text" placeholder="Phnom Penh" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">District</label><input type="text" placeholder="Chamkarmon" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50" /></div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all">Continue to Payment</button>
                </div>
              </div>
            )}

            {/* Step 3: Payment - KHQR / ABA PayWay */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Currency Toggle */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Select Currency</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setCurrency('USD')} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${currency === 'USD' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-2xl">$</span>
                      <div className="text-left"><div className="font-bold text-gray-900">US Dollar</div><div className="text-sm text-gray-500">USD</div></div>
                    </button>
                    <button onClick={() => setCurrency('KHR')} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${currency === 'KHR' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-2xl font-bold">&#6107;</span>
                      <div className="text-left"><div className="font-bold text-gray-900">Khmer Riel</div><div className="text-sm text-gray-500">KHR</div></div>
                    </button>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-3">
                    {/* KHQR */}
                    <button onClick={() => setPaymentMethod('khqr')} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'khqr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-black text-xs leading-none">
                        <div className="text-center"><div>KH</div><div>QR</div></div>
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-gray-900">KHQR (Bakong)</div>
                        <div className="text-xs text-gray-500">ABA, ACLEDA, Wing, TrueMoney, Pi Pay & more</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'khqr' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {paymentMethod === 'khqr' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>

                    {/* ABA PayWay */}
                    <button onClick={() => setPaymentMethod('aba')} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'aba' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-900 rounded-xl flex items-center justify-center text-white font-black text-sm">ABA</div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-gray-900">ABA PayWay</div>
                        <div className="text-xs text-gray-500">Pay with ABA Bank card or account</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'aba' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {paymentMethod === 'aba' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>

                    {/* Cash on Delivery */}
                    <button onClick={() => setPaymentMethod('cod')} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white"><Truck className="w-6 h-6" /></div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-gray-900">Cash on Delivery</div>
                        <div className="text-xs text-gray-500">Pay when you receive your order</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* KHQR QR Code Display */}
                {paymentMethod === 'khqr' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* KHQR Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <div className="text-blue-800 font-black text-xs leading-none text-center"><div>KH</div><div>QR</div></div>
                        </div>
                        <div><div className="text-white font-bold">KHQR Payment</div><div className="text-blue-200 text-xs">Powered by Bakong</div></div>
                      </div>
                      <div className="text-right"><div className="text-blue-200 text-xs">Amount</div><div className="text-white font-black text-xl">{displayTotal}</div></div>
                    </div>

                    <div className="p-8 text-center">
                      <p className="text-gray-600 mb-5 text-sm">Scan this QR code with any Bakong-supported banking app</p>

                      {/* QR Code */}
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-lg mb-5">
                        <QRCodeSVG
                          value={khqrPayload}
                          size={220}
                          level="H"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#1e3a5f"
                        />
                      </div>

                      {/* Supported banks */}
                      <div className="mb-5">
                        <p className="text-xs text-gray-400 mb-3">Supported by</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {['ABA', 'ACLEDA', 'Wing', 'TrueMoney', 'Pi Pay', 'Canadia', 'Prince', 'Sathapana'].map(bank => (
                            <span key={bank} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg border border-gray-200">{bank}</span>
                          ))}
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5 border border-blue-100">
                        <div className="text-sm text-blue-700 font-medium mb-1">Total Amount</div>
                        <div className="text-3xl font-black text-blue-900">{displayTotal}</div>
                        {currency === 'USD' && <div className="text-sm text-blue-500 mt-1">&#8776; {formatKHR(totalUSD)} KHR</div>}
                        {currency === 'KHR' && <div className="text-sm text-blue-500 mt-1">&#8776; ${totalUSD.toFixed(2)} USD</div>}
                      </div>

                      <div className="text-xs text-gray-400 mb-4">Order: {orderNumber}</div>

                      {paymentStatus === 'pending' && (
                        <div className="max-w-sm mx-auto mb-5 text-left">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Payment Receipt</label>
                          <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all text-sm font-medium text-gray-600 relative overflow-hidden">
                            {paymentProof ? (
                               <div className="flex flex-col items-center">
                                 <img src={paymentProof} className="max-h-24 object-contain mb-2 rounded" alt="Receipt" />
                                 <span className="text-blue-600 text-xs text-center break-all">Receipt Uploaded. Click to change.</span>
                               </div>
                            ) : (
                               <span><Upload className="w-4 h-4 inline mr-2 text-blue-500" /> Choose Image</span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setPaymentProof(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        </div>
                      )}

                      {paymentStatus === 'pending' && (
                        <button onClick={simulatePayment} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />I Have Paid
                        </button>
                      )}
                      {paymentStatus === 'processing' && (
                        <div className="flex items-center justify-center gap-3 py-4 text-blue-600">
                          <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          <span className="font-semibold">Verifying payment...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA PayWay */}
                {paymentMethod === 'aba' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-green-700 to-green-900 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-800 font-black text-sm">ABA</div>
                        <div><div className="text-white font-bold">ABA PayWay</div><div className="text-green-200 text-xs">Secure Payment</div></div>
                      </div>
                      <div className="text-right"><div className="text-green-200 text-xs">Amount</div><div className="text-white font-black text-xl">{displayTotal}</div></div>
                    </div>
                    <div className="p-8 text-center">
                      <p className="text-gray-600 mb-5 text-sm">Scan with ABA Mobile app or enter card details</p>
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-lg mb-5">
                        <QRCodeSVG value={khqrPayload} size={220} level="H" bgColor="#ffffff" fgColor="#006847" />
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 mb-5 border border-green-100">
                        <div className="text-sm text-green-700 font-medium mb-1">Total Amount</div>
                        <div className="text-3xl font-black text-green-900">{displayTotal}</div>
                        {currency === 'USD' && <div className="text-sm text-green-500 mt-1">&#8776; {formatKHR(totalUSD)} KHR</div>}
                      </div>

                      {paymentStatus === 'pending' && (
                        <div className="max-w-sm mx-auto mb-5 text-left">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Payment Receipt</label>
                          <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-green-400 transition-all text-sm font-medium text-gray-600 relative overflow-hidden">
                            {paymentProof ? (
                               <div className="flex flex-col items-center">
                                 <img src={paymentProof} className="max-h-24 object-contain mb-2 rounded" alt="Receipt" />
                                 <span className="text-green-600 text-xs text-center break-all">Receipt Uploaded. Click to change.</span>
                               </div>
                            ) : (
                               <span><Upload className="w-4 h-4 inline mr-2 text-green-600" /> Choose Image</span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setPaymentProof(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        </div>
                      )}

                      {paymentStatus === 'pending' && (
                        <button onClick={simulatePayment} className="w-full py-4 bg-gradient-to-r from-green-700 to-green-900 text-white rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />I Have Paid
                        </button>
                      )}
                      {paymentStatus === 'processing' && (
                        <div className="flex items-center justify-center gap-3 py-4 text-green-600">
                          <div className="w-6 h-6 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
                          <span className="font-semibold">Verifying payment...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cash on Delivery */}
                {paymentMethod === 'cod' && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8 text-amber-600" /></div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Cash on Delivery</h3>
                      <p className="text-gray-500 text-sm mb-4">Pay {displayTotal} when your order arrives</p>
                      <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-100 text-left">
                        <ul className="space-y-2 text-sm text-amber-800">
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-600" />Free delivery for orders above $50</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-600" />Pay in USD or KHR upon delivery</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-600" />Delivery within Phnom Penh: 1-2 hours</li>
                        </ul>
                      </div>
                      <button onClick={() => { setFrozenOrder({ cartItems }); setStep(4); if (onPlaceOrder) { onPlaceOrder(cartItems, totalUSD, 'Cash on Delivery', { orderNumber, subtotal, shipping, tax, currency, userEmail: user?.email }); } toast.success('Order placed!', { description: 'Cash on Delivery' }); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all">Confirm Order (COD)</button>
                    </div>
                  </div>
                )}

                <button onClick={() => setStep(2)} className="w-full py-3 border border-gray-200 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 text-sm">Back to Delivery</button>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle className="w-12 h-12 text-green-600" /></div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                <p className="text-gray-500 mb-1">Order #{orderNumber}</p>
                <p className="text-gray-600 mb-6">Thank you! Your order has been placed successfully.</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-block">
                  <div className="text-sm text-gray-500 mb-1">Total Paid</div>
                  <div className="text-2xl font-black text-gray-900">{displayTotal}</div>
                  <div className="text-xs text-gray-400 mt-1">via {paymentMethod === 'khqr' ? 'KHQR (Bakong)' : paymentMethod === 'aba' ? 'ABA PayWay' : 'Cash on Delivery'}</div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('home')} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold hover:shadow-lg transition-all">Continue Shopping</button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h3>
              {currentCart.length > 0 && (
                <div className="space-y-3 mb-4">{currentCart.slice(0, 3).map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{item.name}</p><p className="text-xs text-gray-500">x{item.quantity}</p></div>
                    <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}{currentCart.length > 3 && <p className="text-xs text-gray-400 text-center">+{currentCart.length - 3} more items</p>}</div>
              )}
              <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4 mb-4">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1">
                <div className="flex justify-between font-bold text-lg text-gray-900"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>In KHR</span><span>{totalKHR.toLocaleString()} &#6107;</span></div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500"><Lock className="w-3.5 h-3.5 text-teal-500" />Secure payment</div>
                <div className="flex items-center gap-2 text-xs text-gray-500"><Shield className="w-3.5 h-3.5 text-teal-500" />Buyer protection</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ACCOUNT PAGE (simplified) ============
function AccountPage({ user, onLogout, navigate, orderHistory = [], isAdmin }) {
  const [tab, setTab] = useState('orders');
  const { t } = useLang();
  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const nameParts = userName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">{userInitials}</div>
            <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{userName}</h1><p className="text-gray-500">{userEmail}</p></div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
            <NavLink onClick={() => navigate('admin')} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm font-semibold">
              <LayoutDashboard className="w-4 h-4" />{t('adminDashboard')}
            </NavLink>
            )}
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm font-medium">
              <LogOut className="w-4 h-4" />{t('signOut')}
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[{ id: 'orders', label: t('orders'), icon: Package }, { id: 'refills', label: t('refills'), icon: RefreshCw }, { id: 'profile', label: t('profile'), icon: Settings }].map(tt => (
            <button key={tt.id} onClick={() => setTab(tt.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${tab === tt.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-teal-300'}`}><tt.icon className="w-4 h-4" />{tt.label}</button>
          ))}
        </div>
        {tab === 'orders' && (
          orderHistory.length > 0 ? (
            <div className="space-y-4">
              {orderHistory.map(o => (
                <div key={o.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Order #{o.id}</h3>
                      <p className="text-sm text-gray-500">{o.date} · {o.items?.length || 0} items · via {o.paymentMethod || 'N/A'}</p>
                    </div>
                    <span className="px-3 py-1 text-sm font-semibold rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">{o.status}</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">${o.total?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
              <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">{t('noOrdersYet')}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('noOrdersDesc')}</p>
              <NavLink onClick={() => navigate('home')} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all">
                <ShoppingBag className="w-5 h-5" />{t('startShopping')}
              </NavLink>
            </div>
          )
        )}
        {tab === 'refills' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
            <RefreshCw className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">{t('noRefillsYet')}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('noRefillsDesc')}</p>
            <NavLink onClick={() => navigate('prescription')} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all">
              <Upload className="w-5 h-5" />{t('uploadPrescription')}
            </NavLink>
          </div>
        )}
        {tab === 'profile' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('firstName')}</label><input type="text" defaultValue={firstName} placeholder="First name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" /></div><div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('lastName')}</label><input type="text" defaultValue={lastName} placeholder="Last name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" /></div></div>
            <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('email')}</label><input type="email" defaultValue={userEmail} placeholder="your@email.com" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" /></div>
            <button className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all">{t('saveChanges')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PRESCRIPTION PAGE ============
function PrescriptionPage({ user, onSubmitPrescription }) {
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Max 5MB per file' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFiles(prev => [...prev, { name: file.name, size: file.size, type: file.type }]);
      setFilePreviews(prev => [...prev, { name: file.name, data: ev.target.result, type: file.type }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    setSubmitting(true);
    try {
      await onSubmitPrescription({
        patientName: name,
        phone,
        address,
        notes,
        fileNames: files.map(f => f.name),
        fileData: filePreviews.map(f => ({ name: f.name, data: f.data, type: f.type })),
      });
      setSubmitted(true);
    } catch (err) {
      toast.error('Failed to submit', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Prescription Submitted!</h2>
            <p className="text-gray-500 mb-2">Our pharmacists will review your prescription within 2-4 hours.</p>
            <p className="text-sm text-gray-400 mb-6">You will receive a notification once it is reviewed.</p>
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 mb-6 border border-teal-100 dark:border-teal-800">
              <p className="text-teal-700 dark:text-teal-400 text-sm font-medium">📋 {files.length} file(s) uploaded for {name}</p>
            </div>
            <button onClick={() => { setSubmitted(false); setFiles([]); setFilePreviews([]); setNotes(''); }} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              Upload Another Prescription
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Upload Prescription</h1>
          <p className="text-gray-500">Our pharmacists will review within 2-4 hours</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center hover:border-teal-400 transition-colors">
            <Upload className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Drop your prescription here</h3>
            <p className="text-gray-500 text-sm mb-5">Supports images & PDF (Max 5MB)</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold cursor-pointer hover:shadow-lg transition-all">
              <FileText className="w-5 h-5" />Choose File
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFile} />
            </label>
          </div>

          {/* File Previews */}
          {filePreviews.length > 0 && (
            <div className="mt-5 space-y-3">
              {filePreviews.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  {f.type?.startsWith('image/') ? (
                    <img src={f.data} alt={f.name} className="w-14 h-14 rounded-lg object-cover border border-green-200" />
                  ) : (
                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-green-200">
                      <FileText className="w-6 h-6 text-teal-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-gray-500">{(files[i]?.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <button onClick={() => removeFile(i)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              {filePreviews.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 text-sm cursor-pointer hover:border-teal-400 transition-colors">
                  <Plus className="w-4 h-4" />Add Another File
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFile} />
                </label>
              )}
            </div>
          )}

          {/* Patient Info */}
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sok Dara" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+855 12 345 678" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Delivery Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street 123, Sangkat BKK1, Phnom Penh" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes (Optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special instructions for the pharmacist..." className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white resize-none" />
            </div>
          </div>

          {/* Submit */}
          <button disabled={files.length === 0 || submitting} onClick={handleSubmit} className="w-full mt-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold disabled:opacity-50 hover:shadow-lg transition-all flex items-center justify-center gap-2">
            {submitting ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
            ) : (
              <><Upload className="w-5 h-5" />Submit Prescription</>
            )}
          </button>

          {!user && (
            <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
              💡 Sign in to track your prescription status and receive notifications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ LOGIN PAGE ============
function LoginPage({ navigate, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      toast.success('Welcome back!', { description: `Signed in as ${data.user.email}` });
      onAuthSuccess(data.user);
      navigate('home');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <span className="text-white font-bold text-2xl">Rx</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" minLength={6} className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <NavLink onClick={() => navigate('signup')} className="text-teal-600 font-semibold hover:underline">Create Account</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SIGNUP PAGE ============
function SignupPage({ navigate, onAuthSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (authError) throw authError;
      if (data.user && data.session) {
        toast.success('Account created!', { description: `Welcome, ${name}!` });
        onAuthSuccess(data.user);
        navigate('home');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-600" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
          <p className="text-gray-600 mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <NavLink onClick={() => navigate('login')} className="text-teal-600 font-semibold hover:underline">Back to Sign In</NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500">Join 50,000+ families on Batto Pharmacy</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" minLength={6} className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-sm" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</> : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <NavLink onClick={() => navigate('login')} className="text-teal-600 font-semibold hover:underline">Sign In</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ WISHLIST PAGE ============
function WishlistPage({ wishlist, toggleWishlist, navigate, onAddToCart }) {
  const { products } = useProducts();
  const { t } = useLang();
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('wishlist')}</h1>
          <p className="text-gray-500">{wishlistProducts.length} {t('products')}</p>
        </div>
        {wishlistProducts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center max-w-md mx-auto">
            <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">{t('noWishlist')}</h3>
            <p className="text-gray-500 mb-6">{t('noWishlistDesc')}</p>
            <NavLink onClick={() => navigate('home')} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              <ShoppingBag className="w-5 h-5" />{t('browseProducts')}
            </NavLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group relative">
                <button onClick={() => toggleWishlist(p.id)} className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-red-50 transition-colors">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                </button>
                <NavLink onClick={() => navigate('product', { productId: p.id })} className="block">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </NavLink>
                <div className="p-4">
                  <div className="text-xs text-teal-600 font-medium mb-1">{p.brand}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm line-clamp-2">{p.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">${p.price}</div>
                    {p.originalPrice && <div className="text-sm text-gray-400 line-through">${p.originalPrice}</div>}
                  </div>
                  <button onClick={() => onAddToCart(p)} className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold">
                    <ShoppingCart className="w-4 h-4" />{t('addToCart')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ADMIN DASHBOARD ============
function AdminDashboard({ orderHistory, onUpdateOrderStatus, onUpdateOrderPaymentStatus, onRemovePaymentProof, prescriptions = [], onUpdatePrescriptionStatus }) {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { t } = useLang();
  const [adminTab, setAdminTab] = useState('orders');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedRx, setExpandedRx] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchOrder, setSearchOrder] = useState('');
  
  // Product state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', brand: '', category: 'vitamins', price: 0, image: '', inStock: true });

  const handleProductModal = (p = null) => {
    if (p) { setEditingProduct(p); setFormData({ ...p }); }
    else { setEditingProduct(null); setFormData({ name: '', brand: '', category: 'vitamins', price: 0, image: '', inStock: true }); }
    setShowProductModal(true);
  };
  const saveProduct = () => {
    if (!formData.name) return;
    if (editingProduct) updateProduct(editingProduct.id, formData);
    else addProduct(formData);
    setShowProductModal(false);
  };

  const totalSales = orderHistory.reduce((sum, o) => sum + (o.total || 0), 0);
  const confirmedOrders = orderHistory.filter(o => o.status === 'Confirmed').length;
  const processingOrders = orderHistory.filter(o => o.status === 'Processing').length;
  const shippedOrders = orderHistory.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = orderHistory.filter(o => o.status === 'Delivered').length;

  const stats = [
    { label: t('totalSales'), value: `$${totalSales.toFixed(2)}`, icon: TrendingUp, color: 'from-teal-500 to-emerald-500' },
    { label: t('totalOrders'), value: orderHistory.length, icon: Package, color: 'from-blue-500 to-indigo-500' },
    { label: 'Pending', value: confirmedOrders + processingOrders, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: 'Delivered', value: deliveredOrders, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
  ];

  const ORDER_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const statusColors = {
    'Confirmed': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
    'Processing': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
    'Shipped': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200',
    'Delivered': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
    'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  };

  const statusIcons = {
    'Confirmed': CheckCircle,
    'Processing': Clock,
    'Shipped': Truck,
    'Delivered': BadgeCheck,
    'Cancelled': X,
  };

  const nextStatus = {
    'Confirmed': 'Processing',
    'Processing': 'Shipped',
    'Shipped': 'Delivered',
  };

  const filteredOrders = orderHistory
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => !searchOrder || o.id?.toLowerCase().includes(searchOrder.toLowerCase()) || o.userEmail?.toLowerCase().includes(searchOrder.toLowerCase()));

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminDashboard')}</h1>
              <p className="text-gray-500 text-sm">Manage orders, products & customers</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[{ id: 'orders', label: 'Orders', icon: Package }, { id: 'payments', label: 'Payments', icon: CreditCard }, { id: 'prescriptions', label: 'Prescriptions', icon: FileText }, { id: 'overview', label: 'Overview', icon: BarChart3 }, { id: 'products', label: 'Products', icon: ShoppingBag }].map(tab => (
            <button key={tab.id} onClick={() => setAdminTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${adminTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
              {tab.id === 'orders' && orderHistory.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">{orderHistory.length}</span>}
              {tab.id === 'prescriptions' && prescriptions.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">{prescriptions.filter(p => p.status === 'Pending').length || prescriptions.length}</span>}
            </button>
          ))}
        </div>

        {/* ====== ORDERS TAB ====== */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            {/* Order Status Filter + Search */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchOrder} onChange={e => setSearchOrder(e.target.value)} placeholder="Search by order # or email..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white" />
                </div>
                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto">
                  <button onClick={() => setStatusFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                    All ({orderHistory.length})
                  </button>
                  {ORDER_STATUSES.map(status => {
                    const count = orderHistory.filter(o => o.status === status).length;
                    return (
                      <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === status ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                        {status} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">
                  {orderHistory.length === 0 ? 'No Orders Yet' : 'No matching orders'}
                </h3>
                <p className="text-gray-500">
                  {orderHistory.length === 0 ? 'Orders will appear here when customers make purchases.' : 'Try adjusting your filters or search.'}
                </p>
              </div>
            ) : filteredOrders.map(o => {
              const isExpanded = expandedOrder === o.id;
              const StatusIcon = statusIcons[o.status] || CheckCircle;
              const canAdvance = nextStatus[o.status];
              return (
                <div key={o.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Order Header */}
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : o.id)}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[o.status]?.split(' ')[0] || 'bg-gray-100'}`}>
                          <StatusIcon className={`w-5 h-5 ${statusColors[o.status]?.split(' ')[1] || 'text-gray-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">Order #{o.id}</h3>
                          <p className="text-sm text-gray-500">
                            {o.date} · {o.items?.length || 0} items · {o.paymentMethod || 'N/A'}
                            {o.userEmail && <span className="ml-2 text-indigo-500">· {o.userEmail}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white text-lg">${(o.total || 0).toFixed(2)}</div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${statusColors[o.status] || 'bg-gray-50 text-gray-600'}`}>
                            <StatusIcon className="w-3 h-3" />{o.status}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      {/* Order Items */}
                      <div className="p-5">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {(o.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.qty || item.quantity || 1}</p>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">${(item.price || 0).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Info Grid */}
                      <div className="px-5 pb-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Payment Method</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{o.paymentMethod || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Payment Status</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {o.paymentStatus === 'Verified' ? (
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span>
                              ) : (
                                <span className="text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3"/> {o.paymentStatus || 'Pending'}</span>
                              )}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{o.userEmail || 'Guest'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Date</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{o.date}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Proof (if uploaded) */}
                      {o.paymentProof && (
                        <div className="px-5 pb-3">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Payment Receipt</h4>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to remove this receipt?')) onRemovePaymentProof(o.id); }} className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all dark:bg-red-900/20 dark:hover:bg-red-900/40">
                              <Trash2 className="w-3.5 h-3.5" /> Remove Receipt
                            </button>
                          </div>
                          <a href={o.paymentProof} target="_blank" rel="noopener noreferrer" className="inline-block border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow relative group w-48 h-32">
                            <img src={o.paymentProof} alt="Receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                              View Full Size
                            </div>
                          </a>
                        </div>
                      )}

                      {/* Status Progress */}
                      <div className="px-5 pb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Order Progress</h4>
                        <div className="flex items-center gap-1">
                          {['Confirmed', 'Processing', 'Shipped', 'Delivered'].map((status, idx) => {
                            const StatusStepIcon = statusIcons[status];
                            const isActive = ORDER_STATUSES.indexOf(o.status) >= ORDER_STATUSES.indexOf(status);
                            const isCancelled = o.status === 'Cancelled';
                            return (
                              <div key={status} className="flex items-center flex-1">
                                <div className={`flex flex-col items-center flex-1`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isCancelled ? 'bg-red-100 dark:bg-red-900/30' : isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                    <StatusStepIcon className="w-4 h-4" />
                                  </div>
                                  <span className={`text-[10px] font-medium ${isCancelled ? 'text-red-500' : isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{status}</span>
                                </div>
                                {idx < 3 && <div className={`h-0.5 flex-1 mb-4 ${isCancelled ? 'bg-red-200' : isActive && ORDER_STATUSES.indexOf(o.status) > idx ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 pb-5">
                        <div className="flex flex-wrap gap-2">
                          {canAdvance && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(o.id, nextStatus[o.status]); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                              <ArrowRight className="w-4 h-4" />Move to {nextStatus[o.status]}
                            </button>
                          )}
                          {o.status !== 'Delivered' && o.status !== 'Cancelled' && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(o.id, 'Delivered'); }} className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-semibold text-sm hover:bg-green-100 transition-all dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              <BadgeCheck className="w-4 h-4" />Mark Delivered
                            </button>
                          )}
                          {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to cancel this order?')) onUpdateOrderStatus(o.id, 'Cancelled'); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                              <X className="w-4 h-4" />Cancel Order
                            </button>
                          )}
                          {o.status === 'Cancelled' && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(o.id, 'Confirmed'); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-all">
                              <RefreshCw className="w-4 h-4" />Restore Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ====== PAYMENTS TAB ====== */}
        {adminTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Payment Verification</h2>
              <p className="text-sm text-gray-500">Review and verify payment receipts uploaded by customers for KHQR and ABA PayWay transactions.</p>
            </div>
            
            {orderHistory.filter(o => o.paymentMethod !== 'Cash on Delivery').length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
                <CreditCard className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">No Payments to Verify</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderHistory.filter(o => o.paymentMethod !== 'Cash on Delivery').map(o => (
                  <div key={o.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">Order #{o.id}</div>
                        <div className="text-xs text-gray-500">{o.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-gray-900 dark:text-white">${(o.total || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{o.paymentMethod}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Payment Status</span>
                        {o.paymentStatus === 'Verified' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </div>
                        ) : o.paymentStatus === 'Rejected' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
                            <X className="w-4 h-4" /> Rejected
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold">
                            <Clock className="w-4 h-4" /> Pending Review
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 mb-4 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0">Receipt Image</span>
                          {o.paymentProof && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to remove this receipt?')) onRemovePaymentProof(o.id); }} className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all dark:bg-red-900/20 dark:hover:bg-red-900/40">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                        {o.paymentProof ? (
                          <a href={o.paymentProof} target="_blank" rel="noopener noreferrer" className="block w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow relative group">
                            <img src={o.paymentProof} alt="Receipt" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold bg-gray-900/50">
                              View Full Size
                            </div>
                          </a>
                        ) : (
                          <div className="w-full h-40 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                            No Receipt Uploaded
                          </div>
                        )}
                      </div>
                      
                      {o.paymentStatus !== 'Verified' && (
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <button onClick={() => onUpdateOrderPaymentStatus(o.id, 'Verified')} className="flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
                            <CheckCircle className="w-4 h-4" /> Verify
                          </button>
                          <button onClick={() => onUpdateOrderPaymentStatus(o.id, 'Rejected')} className="flex items-center justify-center gap-1.5 py-2.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-all shadow-sm">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                      {o.paymentStatus === 'Verified' && (
                        <div className="grid grid-cols-1 mt-auto">
                          <button onClick={() => onUpdateOrderPaymentStatus(o.id, 'Pending')} className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all shadow-sm">
                            <RefreshCw className="w-4 h-4" /> Reset Status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== OVERVIEW TAB ====== */}
        {adminTab === 'overview' && (
          <div className="space-y-6">
            {/* Sales by Category */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sales Overview</h3>
              <div className="space-y-4">
                {['Vitamins & Supplements', 'Cold & Flu', 'Pain Relief', 'Skincare', 'Diabetes Care'].map((cat, i) => {
                  const width = [85, 65, 72, 58, 45][i];
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{cat}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{width}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Order Status Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ORDER_STATUSES.map(status => {
                  const count = orderHistory.filter(o => o.status === status).length;
                  const StatusStepIcon = statusIcons[status];
                  return (
                    <div key={status} className={`rounded-xl p-4 border text-center ${statusColors[status] || 'bg-gray-50 border-gray-200'}`}>
                      <StatusStepIcon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs font-medium">{status}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
              {orderHistory.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orderHistory.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[o.status]?.split(' ')[0] || 'bg-gray-100'}`}>
                          {React.createElement(statusIcons[o.status] || CheckCircle, { className: `w-4 h-4 ${statusColors[o.status]?.split(' ')[1] || 'text-gray-500'}` })}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">#{o.id}</p>
                          <p className="text-xs text-gray-500">{o.date} · {o.userEmail || 'Guest'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">${(o.total || 0).toFixed(2)}</p>
                        <span className={`text-xs font-semibold ${statusColors[o.status]?.split(' ')[1] || 'text-gray-500'}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== PRODUCTS TAB ====== */}
        {adminTab === 'products' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Manage Products</h3>
              <button onClick={() => handleProductModal()} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" />Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image || 'https://via.placeholder.com/150'} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">{p.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">${parseFloat(p.price).toFixed(2)}</td>
                      <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${p.inStock ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{p.inStock ? 'In Stock' : 'Out'}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleProductModal(p)} className="p-2 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { if(window.confirm('Delete product?')) deleteProduct(p.id); }} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                     <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No products found. Add one!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== PRODUCT MODAL ====== */}
        {showProductModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Brand</label><input type="text" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" /></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price ($)</label>
                    <input type="number" step="0.01" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white" />
                    
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 mt-4">Image or Image URL</label>
                    <div className="flex flex-col gap-2">
                      <input type="text" value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-xs" placeholder="https://..." />
                      <label className="relative cursor-pointer bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-xl text-center">
                        <span><Upload className="w-4 h-4 inline mr-2" />Upload Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => { setFormData(prev => ({...prev, image: reader.result})); };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Image Preview</label>
                    <div className="w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" id="stock" checked={formData.inStock} onChange={e=>setFormData({...formData, inStock: e.target.checked})} className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500" />
                  <label htmlFor="stock" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">In Stock</label>
                  
                  <input type="checkbox" id="prescription" checked={formData.prescriptionRequired} onChange={e=>setFormData({...formData, prescriptionRequired: e.target.checked})} className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 ml-6" />
                  <label htmlFor="prescription" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Prescription Required</label>
                </div>
                <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label><textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white resize-none" /></div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowProductModal(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={saveProduct} className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all">Save Product</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== PRESCRIPTIONS TAB ====== */}
        {adminTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 shadow-sm text-center">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">No Prescriptions Yet</h3>
                <p className="text-gray-500">Prescriptions will appear here when customers upload them.</p>
              </div>
            ) : prescriptions.map(rx => {
              const isExpanded = expandedRx === rx.id;
              const rxStatusColors = {
                'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
                'Reviewing': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                'Approved': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
                'Rejected': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
              };
              const rxStatusIcons = { 'Pending': Clock, 'Reviewing': Eye, 'Approved': CheckCircle, 'Rejected': X };
              const RxIcon = rxStatusIcons[rx.status] || Clock;
              return (
                <div key={rx.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Header */}
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedRx(isExpanded ? null : rx.id)}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{rx.patientName}</h3>
                          <p className="text-sm text-gray-500">
                            {rx.date} · {rx.fileNames?.length || 0} file(s) · {rx.phone}
                            {rx.userEmail && <span className="ml-2 text-indigo-500">· {rx.userEmail}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${rxStatusColors[rx.status] || 'bg-gray-50 text-gray-600'}`}>
                          <RxIcon className="w-3 h-3" />{rx.status}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      {/* Patient Info */}
                      <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{rx.patientName}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{rx.phone || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Address</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{rx.address || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Email</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{rx.userEmail || 'Guest'}</p>
                          </div>
                        </div>
                        {rx.notes && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4 border border-amber-100 dark:border-amber-800">
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">Patient Notes</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">{rx.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Prescription Images */}
                      <div className="px-5 pb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Prescription Files</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(rx.fileData || []).map((file, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                              {file.type?.startsWith('image/') ? (
                                <img src={file.data} alt={file.name} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(file.data, '_blank')} />
                              ) : (
                                <div className="w-full h-40 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center">
                                  <FileText className="w-10 h-10 text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-500">PDF Document</p>
                                </div>
                              )}
                              <div className="p-2 bg-gray-50 dark:bg-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</p>
                              </div>
                            </div>
                          ))}
                          {(!rx.fileData || rx.fileData.length === 0) && rx.fileNames?.map((fname, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{fname}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 pb-5">
                        <div className="flex flex-wrap gap-2">
                          {rx.status === 'Pending' && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdatePrescriptionStatus(rx.id, 'Reviewing'); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                              <Eye className="w-4 h-4" />Start Review
                            </button>
                          )}
                          {(rx.status === 'Pending' || rx.status === 'Reviewing') && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); onUpdatePrescriptionStatus(rx.id, 'Approved'); }} className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-semibold text-sm hover:bg-green-100 transition-all dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                <CheckCircle className="w-4 h-4" />Approve
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); onUpdatePrescriptionStatus(rx.id, 'Rejected'); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                <X className="w-4 h-4" />Reject
                              </button>
                            </>
                          )}
                          {(rx.status === 'Approved' || rx.status === 'Rejected') && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdatePrescriptionStatus(rx.id, 'Pending'); }} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all">
                              <RefreshCw className="w-4 h-4" />Reset to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState('km');
  const [wishlist, setWishlist] = usePersistentState('grx_wishlist', []);
  const [orderHistory, setOrderHistory] = usePersistentState('grx_orders', []);
  const [productReviews, setProductReviews] = usePersistentState('grx_reviews', {});
  const [prescriptions, setPrescriptions] = useState([]);

  const t = useCallback((key) => translations[lang]?.[key] || translations.en?.[key] || key, [lang]);

  // Listen for auth state changes & load orders
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        loadOrdersFromSupabase(session.user);
        loadPrescriptionsFromSupabase(session.user);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrdersFromSupabase(session.user);
        loadPrescriptionsFromSupabase(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load orders from Supabase
  const loadOrdersFromSupabase = async (currentUser) => {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      // If the user isn't an admin, securely enforce client-side filtering to their own orders, 
      // preventing viewing other data if RLS happens to fail or is not configured.
      if (!checkIsAdmin(currentUser)) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Could not load orders from Supabase:', error.message);
        return;
      }
      if (data) {
        const formatted = data.map(o => ({
          id: o.order_number,
          date: new Date(o.created_at).toISOString().split('T')[0],
          items: o.items || [],
          total: parseFloat(o.total),
          paymentMethod: o.payment_method,
          status: o.status,
          currency: o.currency,
          userEmail: o.user_email,
          paymentProof: o.payment_proof,
          paymentStatus: o.payment_status,
        }));
        setOrderHistory(() => {
          try { localStorage.setItem('grx_orders', JSON.stringify(formatted)); } catch {}
          return formatted;
        });
      }
    } catch (err) {
      console.warn('Error loading orders:', err);
    }
  };

  // Load prescriptions from Supabase
  const loadPrescriptionsFromSupabase = async (currentUser) => {
    try {
      let query = supabase.from('prescriptions').select('*').order('created_at', { ascending: false });
      
      if (!checkIsAdmin(currentUser)) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Could not load prescriptions from Supabase:', error.message);
        return;
      }
      if (data) {
        const formatted = data.map(rx => ({
          id: rx.id,
          patientName: rx.patient_name,
          phone: rx.phone,
          address: rx.address,
          notes: rx.notes,
          userEmail: rx.user_email,
          fileNames: rx.file_names || [],
          fileData: rx.file_data || [],
          status: rx.status,
          date: new Date(rx.created_at).toISOString().split('T')[0],
        }));
        setPrescriptions(formatted);
      }
    } catch (err) {
      console.warn('Error loading prescriptions:', err);
    }
  };

  // Submit prescription (from client)
  const submitPrescription = useCallback(async (data) => {
    const rxRecord = {
      id: `RX-${Date.now().toString(36).toUpperCase()}`,
      patientName: data.patientName,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      fileNames: data.fileNames,
      fileData: data.fileData,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      userEmail: user?.email || 'Guest',
    };

    // Save locally
    setPrescriptions(prev => [rxRecord, ...prev]);

    // Save to Supabase
    try {
      const { error } = await supabase.from('prescriptions').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'Guest',
        patient_name: data.patientName,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        file_names: data.fileNames,
        file_data: data.fileData,
        status: 'Pending',
      });
      if (error) console.warn('Could not save prescription to Supabase:', error.message);
    } catch (err) {
      console.warn('Error saving prescription:', err);
    }

    toast.success('Prescription submitted!', { description: 'Our pharmacist will review it within 2-4 hours.' });
  }, [user]);

  // Update prescription status (admin)
  const updatePrescriptionStatus = useCallback(async (rxId, newStatus) => {
    setPrescriptions(prev => prev.map(rx => rx.id === rxId ? { ...rx, status: newStatus } : rx));
    toast.success(`Prescription ${newStatus.toLowerCase()}`, { description: `Status updated to ${newStatus}` });

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', rxId);
      if (error) console.warn('Could not update prescription in Supabase:', error.message);
    } catch (err) {
      console.warn('Error updating prescription:', err);
    }
  }, []);

  const isAdmin = checkIsAdmin(user);

  // Load and manage Products from Supabase
  const [productsDb, setProductsDb] = usePersistentState('grx_db_products', initialProducts);
  
  useEffect(() => {
    loadProductsFromSupabase();
  }, []);

  const loadProductsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setProductsDb(data.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0,
          originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
          inStock: p.in_stock,
          prescriptionRequired: p.prescription_required
        })));
      } else if (data && data.length === 0) {
        // Init table if empty
        const records = initialProducts.map(p => ({
          id: p.id.length > 5 ? p.id : `P-${Date.now()}-${p.id}`,
          name: p.name,
          brand: p.brand,
          category: p.category,
          image: p.image,
          price: p.price,
          original_price: p.originalPrice || null,
          in_stock: p.inStock,
          prescription_required: p.prescriptionRequired || false,
          description: p.description
        }));
        await supabase.from('products').insert(records);
        setProductsDb(records.map(r => ({...r, price: r.price, inStock: r.in_stock})));
      }
    } catch (err) {
      console.warn('Could not load products:', err);
    }
  };

  const addProduct = async (p) => {
    const newProduct = { ...p, id: `P-${Date.now()}` };
    setProductsDb(prev => [newProduct, ...prev]);
    toast.success('Product added successfully!');
    try {
      await supabase.from('products').insert([{
        id: newProduct.id,
        name: p.name, brand: p.brand, category: p.category, image: p.image,
        price: p.price, in_stock: p.inStock, prescription_required: p.prescriptionRequired, description: p.description
      }]);
    } catch (err) { console.warn('Supabase add failed', err); }
  };

  const updateProduct = async (id, p) => {
    setProductsDb(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
    toast.success('Product updated!');
    try {
      await supabase.from('products').update({
        name: p.name, brand: p.brand, category: p.category, image: p.image,
        price: p.price, in_stock: p.inStock, prescription_required: p.prescriptionRequired, description: p.description
      }).eq('id', id);
    } catch (err) { console.warn('Supabase update failed', err); }
  };

  const deleteProduct = async (id) => {
    setProductsDb(prev => prev.filter(prod => prod.id !== id));
    toast('Product deleted');
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) { console.warn('Supabase delete failed', err); }
  };

  const navigate = useCallback((page, params = {}) => {
    if (['account'].includes(page) && !user && !authLoading) {
      setCurrentPage('login');
      setPageParams({});
      toast('Please sign in to continue', { description: 'Create an account or log in to access this page.' });
      window.scrollTo(0, 0);
      return;
    }
    if (page === 'admin' && !checkIsAdmin(user)) {
      toast.error('Access denied', { description: 'You do not have admin privileges.' });
      return;
    }
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, [user, authLoading]);

  const handleAuthSuccess = useCallback((authUser) => {
    setUser(authUser);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCartItems([]);
    setCurrentPage('home');
    toast.success('Signed out successfully');
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    toast.success('Added to cart', { description: `${product.name} x${quantity}` });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    toast('Item removed from cart');
  }, []);

  // Update order status (admin only)
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    // Update locally
    setOrderHistory(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      try { localStorage.setItem('grx_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    toast.success(`Order updated to ${newStatus}`, { description: `Order #${orderId}` });

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('order_number', orderId);
      if (error) console.warn('Could not update order in Supabase:', error.message);
    } catch (err) {
      console.warn('Error updating order status:', err);
    }
  }, [setOrderHistory]);

  // Update order payment status (admin only)
  const updateOrderPaymentStatus = useCallback(async (orderId, newStatus) => {
    // Update locally
    setOrderHistory(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o);
      try { localStorage.setItem('grx_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    toast.success(`Payment marked as ${newStatus}`, { description: `Order #${orderId}` });

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('order_number', orderId);
      if (error) console.warn('Could not update payment status in Supabase:', error.message);
    } catch (err) {
      console.warn('Error updating payment status:', err);
    }
  }, [setOrderHistory]);

  // Remove order payment proof (admin only)
  const removeOrderPaymentProof = useCallback(async (orderId) => {
    // Update locally
    setOrderHistory(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentProof: null, paymentStatus: 'Pending' } : o);
      try { localStorage.setItem('grx_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    toast.success('Payment receipt removed', { description: `Order #${orderId}` });

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_proof: null, payment_status: 'Pending', updated_at: new Date().toISOString() })
        .eq('order_number', orderId);
      if (error) console.warn('Could not update payment proof in Supabase:', error.message);
    } catch (err) {
      console.warn('Error removing payment proof:', err);
    }
  }, [setOrderHistory]);

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => {
      const newList = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      try { localStorage.setItem('grx_wishlist', JSON.stringify(newList)); } catch {}
      return newList;
    });
  }, [setWishlist]);

  const placeOrder = useCallback(async (items, total, paymentMethod, extra = {}) => {
    const order = {
      id: extra.orderNumber || `RX-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price, image: i.image })),
      total,
      paymentMethod,
      status: 'Confirmed',
      paymentProof: extra.paymentProof || null,
      paymentStatus: 'Pending',
    };

    // Save locally first
    setOrderHistory(prev => {
      const newHistory = [order, ...prev];
      try { localStorage.setItem('grx_orders', JSON.stringify(newHistory)); } catch {}
      return newHistory;
    });
    setCartItems([]);

    // Save to Supabase
    if (user) {
      try {
        const { error } = await supabase.from('orders').insert({
          order_number: order.id,
          user_id: user.id,
          user_email: user.email,
          items: order.items,
          subtotal: extra.subtotal || total,
          shipping: extra.shipping || 0,
          tax: extra.tax || 0,
          total: total,
          currency: extra.currency || 'USD',
          payment_method: paymentMethod,
          payment_proof: extra.paymentProof || null,
          payment_status: 'Pending',
          status: 'Confirmed',
        });
        if (error) {
          console.warn('Could not save order to Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Error saving order:', err);
      }
    }

    toast.success(t('orderPlaced'), { description: t('orderConfirmation') });
  }, [setOrderHistory, t, user]);

  const addReview = useCallback((productId, review) => {
    setProductReviews(prev => {
      const newReviews = { ...prev, [productId]: [...(prev[productId] || []), { ...review, date: new Date().toISOString().split('T')[0] }] };
      try { localStorage.setItem('grx_reviews', JSON.stringify(newReviews)); } catch {}
      return newReviews;
    });
    toast.success('Review submitted!');
  }, [setProductReviews]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Admin Real-time Alerts for New Orders and Prescriptions
  useEffect(() => {
    if (!user || !checkIsAdmin(user)) return;

    const orderSub = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new;
        toast.success('🔔 New Order Alert!', {
          description: `Order #${newOrder.order_number} for $${newOrder.total}`,
          duration: 15000,
          action: { label: 'View', onClick: () => navigate('admin') }
        });
        loadOrdersFromSupabase(user);
      })
      .subscribe();

    const rxSub = supabase
      .channel('admin-prescriptions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prescriptions' }, (payload) => {
        const newRx = payload.new;
        toast.success('📝 New Prescription Alert!', {
          description: `From: ${newRx.patient_name || 'Guest'}`,
          duration: 15000,
          action: { label: 'View', onClick: () => navigate('admin') }
        });
        loadPrescriptionsFromSupabase(user);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(rxSub);
    };
  }, [user, navigate]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <ProductsContext.Provider value={{ products: productsDb, addProduct, updateProduct, deleteProduct }}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Header navigate={navigate} cartCount={cartCount} currentPage={currentPage} user={user} onLogout={handleLogout} wishlistCount={wishlist.length} isAdmin={isAdmin} />
        <TrustBar />
        <main className="flex-1 pb-16 md:pb-0">
          {currentPage === 'home' && <HomePage navigate={navigate} onAddToCart={addToCart} />}
          {currentPage === 'about' && <AboutPage navigate={navigate} />}
          {currentPage === 'contact' && <ContactPage navigate={navigate} />}
          {currentPage === 'offers' && <OffersPage navigate={navigate} />}
          {currentPage === 'category' && <CategoryPage categoryId={pageParams.categoryId} navigate={navigate} onAddToCart={addToCart} />}
          {currentPage === 'product' && <ProductDetailPage productId={pageParams.productId} navigate={navigate} onAddToCart={addToCart} />}
          {currentPage === 'prescription' && <PrescriptionPage user={user} onSubmitPrescription={submitPrescription} />}
          {currentPage === 'checkout' && <CheckoutPage cartItems={cartItems} onRemoveFromCart={removeFromCart} navigate={navigate} onPlaceOrder={placeOrder} user={user} />}
          {currentPage === 'account' && <AccountPage user={user} onLogout={handleLogout} navigate={navigate} orderHistory={orderHistory} isAdmin={isAdmin} />}
          {currentPage === 'wishlist' && <WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} navigate={navigate} onAddToCart={addToCart} />}
          {currentPage === 'admin' && <AdminDashboard orderHistory={orderHistory} onUpdateOrderStatus={updateOrderStatus} onUpdateOrderPaymentStatus={updateOrderPaymentStatus} onRemovePaymentProof={removeOrderPaymentProof} prescriptions={prescriptions} onUpdatePrescriptionStatus={updatePrescriptionStatus} />}
          {currentPage === 'login' && <LoginPage navigate={navigate} onAuthSuccess={handleAuthSuccess} />}
          {currentPage === 'signup' && <SignupPage navigate={navigate} onAuthSuccess={handleAuthSuccess} />}
        </main>
        <Footer navigate={navigate} />
        <MobileBottomNav currentPage={currentPage} navigate={navigate} />
        <Toaster position="top-center" richColors />
      </div>
      </ProductsContext.Provider>
    </LangContext.Provider>
  );
}

