import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { waitForAuth, logout } from './lib/auth';
import { AcademyAccount } from './types';
import AdminReviewDossier from './AdminReviewDossier';

interface AcademyData extends AcademyAccount {
  userId: string;
  submittedAt?: number;
  totalProgress?: number;
  email?: string;
  adminStatus?: 'approved' | 'declined' | 'pending';
}

function AdminOverview({ academies, onDelete }: { academies: AcademyData[], onDelete: (id: string, email: string) => void }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string, email: string, name: string }>({ isOpen: false, id: '', email: '', name: '' });

  const filteredAcademies = academies.filter(acc => {
    const matchesSearch = (acc.academyName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (acc.loginEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesFilter = filterType === 'all' || 
                          (filterType === 'A' && acc.classificationType === 'A') ||
                          (filterType === 'B' && acc.classificationType === 'B') ||
                          (filterType === 'submitted' && acc.applicationStatus === 'submitted');
                          
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-[#022C22] mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6 font-bold text-sm">
              هل أنت متأكد من حذف أكاديمية <span className="text-red-600">"{deleteModal.name}"</span> نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  onDelete(deleteModal.id, deleteModal.email);
                  setDeleteModal({ isOpen: false, id: '', email: '', name: '' });
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
              >
                نعم، احذف الأكاديمية
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: '', email: '', name: '' })}
                className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلبات", value: academies.length, icon: "folder", color: "bg-blue-50 text-blue-700" },
          { label: "طلبات تصنيف A", value: academies.filter(a => a.classificationType === 'A').length, icon: "star", color: "bg-amber-50 text-amber-700" },
          { label: "طلبات تصنيف B", value: academies.filter(a => a.classificationType === 'B').length, icon: "star_half", color: "bg-emerald-50 text-emerald-700" },
          { label: "قيد المراجعة", value: academies.filter(a => a.applicationStatus === 'submitted' && a.adminStatus !== 'approved' && a.adminStatus !== 'declined').length, icon: "pending_actions", color: "bg-purple-50 text-purple-700" }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-[#E5DED0] shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.color}`}>
              <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black text-[#022C22]">{kpi.value}</div>
              <div className="text-xs font-bold text-[#64748B]">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
        <div className="p-6 border-b border-[#E5DED0] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-xl font-black text-[#022C22]">جميع الطلبات</h2>
          <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="بحث بالاسم أو الإيميل..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A227] w-64" 
             />
             <select
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 outline-none focus:border-[#C9A227]"
             >
                <option value="all">جميع الحالات</option>
                <option value="A">تصنيف A</option>
                <option value="B">تصنيف B</option>
                <option value="submitted">جاهزة للمراجعة (مُرسل)</option>
             </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-[#E5DED0]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase">الأكاديمية</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase">النوع</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase">المنطقة</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase">التقدم</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED0]">
              {filteredAcademies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B] font-bold">لا توجد طلبات تطابق البحث</td>
                </tr>
              ) : (
                filteredAcademies.map((acc) => (
                  <tr key={acc.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center p-1">
                           {acc.academyLogo ? <img src={acc.academyLogo} className="max-w-full max-h-full object-contain" /> : <span className="material-symbols-outlined text-gray-400">sports_soccer</span>}
                         </div>
                         <div>
                           <div className="font-bold text-[#022C22]">{acc.academyName || 'بدون اسم'}</div>
                           <div className="text-xs text-[#64748B]">{acc.loginEmail}</div>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{acc.classificationType === 'A' ? 'الفئة A' : acc.classificationType === 'B' ? 'الفئة B' : 'غير محدد'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#64748B]">{acc.governorate}</td>
                    <td className="px-6 py-4">
                      {acc.applicationStatus === 'submitted' ? (
                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"><span className="material-symbols-outlined text-[14px]">send</span>مُرسل</span>
                      ) : (
                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold"><span className="material-symbols-outlined text-[14px]">edit</span>{acc.totalProgress || 0}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <button onClick={() => navigate(`/admin/academies/${acc.userId}`)} className="px-4 py-2 bg-[#022C22] text-white rounded-lg text-xs font-bold hover:bg-[#064E3B] transition-colors">مراجعة الملف</button>
                         <button onClick={() => setDeleteModal({isOpen: true, id: acc.userId, email: acc.loginEmail || '', name: acc.academyName || 'بدون اسم'})} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors" title="حذف الأكاديمية">
                           <span className="material-symbols-outlined text-[16px]">delete</span>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [academies, setAcademies] = useState<AcademyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleDeleteAcademy = async (id: string, email: string) => {
    try {
      // 1. Delete progress subcollection
      const progressRef = collection(db, 'users', id, 'progress');
      const progressDocs = await getDocs(progressRef);
      const progressDeletePromises = progressDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(progressDeletePromises);

      // 2. Delete adminReviews subcollection
      const reviewsRef = collection(db, 'users', id, 'adminReviews');
      const reviewsDocs = await getDocs(reviewsRef);
      const reviewsDeletePromises = reviewsDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(reviewsDeletePromises);

      // 3. Finally delete the user document
      await deleteDoc(doc(db, 'users', id));
      setAcademies(prev => prev.filter(v => v.userId !== id));
    } catch (err: any) {
      console.error("تعذر حذف الأكاديمية: " + err.message);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const user = await waitForAuth();
        if (!user) {
          setError('يجب تسجيل الدخول كمسؤول.');
          return;
        }
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list: AcademyData[] = [];
        
        // Use Promise.all to fetch progress subcollection for each academy to ensure accurate classificationType & totalProgress
        const fetchPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          if (data.loginEmail === 'grassroots@the-lfa.com.lb') return null;
          
          let { classificationType, totalProgress } = data;
          
          // Inference logic if missing
          if (!classificationType || totalProgress === undefined) {
             const progressRef = collection(db, 'users', docSnapshot.id, 'progress');
             const progressSnap = await getDocs(progressRef);
             
             let inferredType = classificationType;
             let progressSum = 0;
             let count = 0;
             
             progressSnap.forEach(pDoc => {
               const pData = pDoc.data();
               if (pData.key) {
                 if (!inferredType) {
                   if (pData.key.includes('classificationA')) inferredType = 'A';
                   else if (pData.key.includes('classificationB')) inferredType = 'B';
                 }
                 if (pData.data) {
                    try {
                      const parsed = JSON.parse(pData.data);
                      if (parsed.completionPercentage) {
                         progressSum += parsed.completionPercentage;
                         count++;
                      }
                    } catch(e) {}
                 }
               }
             });
             
             if (!classificationType && inferredType) {
                classificationType = inferredType;
             }
             if (totalProgress === undefined) {
                totalProgress = count > 0 ? Math.round(progressSum / count) : 0;
             }
          }
          
          return { ...data, userId: docSnapshot.id, classificationType, totalProgress } as AcademyData;
        });
        
        const results = await Promise.all(fetchPromises);
        results.forEach(res => {
          if (res) list.push(res);
        });
        
        setAcademies(list);
      } catch (err: any) {
        setError('خطأ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAcademies();
  }, []);

  const menuItems = [
    { label: "لوحة التحكم", path: "/admin", icon: "dashboard" },
    { label: "جميع الطلبات", path: "/admin/all", icon: "folder_open" },
    { label: "الملفات الناقصة", path: "/admin/missing", icon: "warning" },
    { label: "الإحصاءات", path: "/admin/stats", icon: "bar_chart" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-right font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#022C22] text-white flex flex-col fixed inset-y-0 right-0 z-10 shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-center gap-3">
          <img src="/logo.png" className="w-10 h-10 object-contain drop-shadow" alt="LFA" />
          <div className="text-sm font-black leading-tight text-[#C9A227]">
            الإدارة المركزية<br/>للأكاديميات
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-2 px-2">القائمة الرئيسية</div>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${isActive ? 'bg-[#C9A227] text-[#022C22]' : 'hover:bg-white/10 text-white/80'}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            خروج من الإدارة
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-64">
        <header className="bg-white h-20 border-b border-[#E5DED0] px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-black text-[#022C22]">المنصة الإدارية للاتحاد</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><span className="material-symbols-outlined">notifications</span></div>
            <div className="w-10 h-10 rounded-full bg-[#022C22] text-[#C9A227] flex items-center justify-center font-bold">LFA</div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-[#064E3B] border-t-transparent flex items-center justify-center rounded-full animate-spin"></div></div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">{error}</div>
          ) : (
            <Routes>
              <Route path="/" element={<AdminOverview academies={academies} onDelete={handleDeleteAcademy} />} />
              <Route path="/all" element={<AdminOverview academies={academies} onDelete={handleDeleteAcademy} />} />
              <Route path="/academies/:academyId/*" element={<AdminReviewDossier />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
