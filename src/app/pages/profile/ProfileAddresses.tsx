import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { ProfilePageShell } from './ProfilePageShell';
import { loadShippingDefaults, saveShippingDefaults } from '@/lib/shippingDefaults';

export function ProfileAddresses() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [line, setLine] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const d = loadShippingDefaults();
    setPhone(d.recipient_phone ?? '');
    setLine(d.address_line ?? '');
    setCity(d.city ?? '');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveShippingDefaults({
      recipient_phone: phone.trim(),
      address_line: line.trim(),
      city: city.trim(),
    });
    toast.success(t('profile.addressesSaved'));
  };

  return (
    <ProfilePageShell title={t('profile.addressesPageTitle')}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
          <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          <p>{t('profile.addressesFormHint')}</p>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('checkout.shippingPhone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('checkout.shippingAddress')}
            </label>
            <input
              type="text"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
              autoComplete="street-address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('checkout.shippingCity')}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
              autoComplete="address-level2"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
          >
            {t('profile.addressesSave')}
          </button>
        </form>
      </div>
    </ProfilePageShell>
  );
}
