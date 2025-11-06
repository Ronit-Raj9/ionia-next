# 🎯 Sidebar Navigation - Quick Usage Guide

## 📐 Default Behavior (Icons Only)

### What You'll See:
```
┌────┐
│ ☰  │ ← Click to expand
│ I  │ ← Logo (collapsed)
├────┤
│ 👤 │ ← User avatar (hover for details)
├────┤
│    │
│ 🏠 │ ← Dashboard (hover for tooltip)
│    │
│ 📝 │ ← Feature icons
│ ✅ │
│ 🧠 │
│    │
│ 👥 │
│ 📊 │
│ 📅 │
│    │
│ 📖 │
│ 💬 │
│    │
├────┤
│ 🚪 │ ← Logout
└────┘
 80px
```

**Default State:**
- ✅ **Icons visible** - All feature icons shown
- ✅ **Compact** - Only 80px wide (maximum screen space)
- ✅ **Tooltips** - Hover over icons to see labels
- ✅ **Functional** - Click any icon to navigate

---

## 🔍 Expanded Behavior (Click Triple-Line Icon)

### What You'll See After Clicking ☰:
```
┌────────────────────────┐
│ ☰  [IONIA Logo]        │ ← Click to collapse
├────────────────────────┤
│ 👤 User Name           │
│    user@email.com      │
│    teacher             │
├────────────────────────┤
│ 🔍 Search...           │
├────────────────────────┤
│                        │
│ 🏠 Dashboard           │
│                        │
│ ASSIGNMENTS            │
│ ├ 📝 Create Assignment │
│ ├ ✅ Grading Center    │
│ └ 🧠 Adaptive...       │
│                        │
│ CLASSROOM              │
│ ├ 👥 Manage...         │
│ ├ 📊 Analytics         │
│ └ 📅 Academic Planner  │
│                        │
│ RESOURCES              │
│ ├ 📖 Study Materials   │
│ └ 💬 Messages [3]      │
│                        │
├────────────────────────┤
│ 🚪 Logout              │
└────────────────────────┘
        280px
```

**Expanded State:**
- ✅ **Full labels visible**
- ✅ **Grouped sections** with titles
- ✅ **Search bar** to filter items
- ✅ **User details** (name, email, role)
- ✅ **Badge notifications** visible
- ✅ **280px wide**

---

## 🎮 How to Use

### Desktop:
1. **By Default** - See icons only (80px sidebar)
2. **Hover Icons** - See tooltips with labels
3. **Click ☰ Icon** - Expand to full width with all labels
4. **Click ☰ Again** - Collapse back to icons only
5. **Use Keyboard** - Press `Ctrl+B` / `Cmd+B` to toggle anytime

### Mobile (< 1024px):
1. **By Default** - Sidebar hidden
2. **Click Hamburger** (top-left) - Full sidebar slides in as drawer
3. **Select Item** - Drawer auto-closes
4. **Click Outside** or X - Close drawer manually

---

## ✨ Interactive Elements

### When Collapsed (Icons Only):
- **Hover Icon** → Tooltip appears showing label
- **Hover User Avatar** → Tooltip shows name, email, role
- **Hover Logout** → Tooltip shows "Logout"
- **Click ☰** → Expands to full width
- **Click Any Icon** → Navigates to that section

### When Expanded (Full Labels):
- **Search Bar** → Filter menu items instantly
- **Click Section** → Navigate to that section
- **Click ☰** → Collapses to icons only
- **Badge Counts** → See notification counts
- **Group Titles** → Visual organization

---

## 🎨 Visual States

### Icon States:
- **Default**: Gray (`text-gray-500`)
- **Hover**: Background highlights (`bg-gray-50`)
- **Active**: Emerald color + left border (`text-emerald-600` + `border-l-emerald-500`)

### Sidebar States:
- **Collapsed**: 80px width, icons only, tooltips on hover
- **Expanded**: 280px width, icons + labels, search visible
- **Mobile**: Full drawer overlay, auto-close on select

---

## 🚀 Benefits

### Space Efficiency:
- **Collapsed**: 80px = **More content space**
- **Expanded**: 280px = **Easy to scan labels**
- **Toggle anytime** = **Best of both worlds**

### Usability:
- **Power users** can navigate quickly by icon
- **New users** can expand to see full labels
- **Tooltips** provide context without expanding
- **Mobile** gets full experience via drawer

---

## 💡 Pro Tips

### Speed Navigation:
1. **Learn Icons** - After a few uses, you'll know icons by heart
2. **Use Tooltips** - Hover to confirm before clicking
3. **Keyboard Shortcut** - `Ctrl+B` is fastest toggle
4. **Search When Expanded** - Type to filter instantly

### Recommended Workflow:
1. **Start Collapsed** - Maximum screen space for work
2. **Hover for Confirmation** - Check tooltips as needed
3. **Expand Occasionally** - When exploring new features
4. **Stay Collapsed** - For daily work with known sections

---

## 📱 Screen Sizes

| Screen Size | Behavior |
|-------------|----------|
| < 1024px (Mobile/Tablet) | Hamburger menu → Full drawer |
| ≥ 1024px (Desktop) | Collapsed by default (80px) |
| Expanded (Desktop) | 280px with full labels |

---

## 🎯 Quick Reference

### Toggle Sidebar:
- **Click** ☰ icon
- **Keyboard** `Ctrl+B` / `Cmd+B`

### Navigate:
- **Collapsed** - Click icon
- **Expanded** - Click label

### Get Help:
- **Collapsed** - Hover for tooltips
- **Expanded** - See full labels
- **Search** - Filter items (when expanded)

---

**TL;DR:**  
🎯 **Icons always visible** → Click ☰ to show/hide labels → Tooltips on hover when collapsed

---

**Last Updated:** November 6, 2025  
**Status:** ✅ Production Ready

