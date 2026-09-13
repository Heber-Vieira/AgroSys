import { PRESET_COMPANIES } from '../data/themeTokensData';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const LOGO_MAP: Record<string, { logoUrl?: string; logoIconId?: string }> = {
  'ciclodrone': {
    logoUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'ciclodrone-helix'
  },
  'agro-clean-emerald': {
    logoUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'agro-leaf-drone'
  },
  'bio-menta-fresh': {
    logoUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'bio-sprout'
  },
  'safra-dourada': {
    logoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'harvest-sun'
  },
  'precision-slate': {
    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'precision-drone'
  },
  'solar-energy': {
    logoUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80',
    logoIconId: 'spray-droplet'
  }
};

async function seedBranding() {
  console.log('🌱 Seeding branding metadata for all companies in Supabase...\n');

  for (const comp of PRESET_COMPANIES) {
    const logoInfo = LOGO_MAP[comp.id] || {};
    const themeMeta = {
      tenantId: comp.id,
      companyName: comp.name,
      tagline: comp.tagline,
      primaryColor: comp.primary,
      secondaryColor: comp.secondary,
      accentColor: comp.accent,
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: '0.875rem',
      logoUrl: logoInfo.logoUrl,
      logoDarkUrl: logoInfo.logoUrl,
      logoIconId: logoInfo.logoIconId || 'ciclodrone-helix',
      logoAdaptiveMode: 'auto',
      contactPhone: comp.contactPhone,
      contactEmail: comp.contactEmail,
      registryCreaMapa: comp.registryCreaMapa
    };

    const packedDescription = `${comp.description} <!--AGRO_THEME:${JSON.stringify(themeMeta)}-->`.trim();

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${comp.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: comp.name,
        trade_name: comp.tradeName || comp.name,
        tagline: comp.tagline,
        primary_color: comp.primary,
        secondary_color: comp.secondary,
        accent_color: comp.accent,
        crop_focus: comp.cropFocus,
        phone: comp.contactPhone || null,
        email: comp.contactEmail || null,
        registry_crea_mapa: comp.registryCreaMapa || null,
        description: packedDescription,
        updated_at: new Date().toISOString()
      })
    });

    if (patchRes.ok) {
      console.log(`✅ Seeded ${comp.name} (${comp.id}) successfully in Supabase tenants.`);
    } else {
      console.log(`❌ Failed ${comp.id}: ${patchRes.status} ${patchRes.statusText}`);
    }
  }

  console.log('\n🎉 Supabase branding seeding complete!');
  process.exit(0);
}

seedBranding().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
