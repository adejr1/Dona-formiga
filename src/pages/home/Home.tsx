export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      <div
        className="pointer-events-none select-none absolute inset-0 opacity-10 mix-blend-multiply bg-center bg-contain bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png')",
        }}
      />

      <div className="relative z-10 text-center px-6">
        <p className="text-xs tracking-[0.5em] uppercase text-rose-500 mb-3">
          Bem-vinda ao seu painel
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold text-rose-900 drop-shadow-sm mb-4">
          DONA FORMIGA
        </h1>
        <p className="text-sm md:text-base text-rose-700 max-w-xl mx-auto mb-8">
          Organize seus bolos, combos e doces em um só lugar, com o jeitinho
          da sua marca. Use o menu ao lado para acessar seu cardápio.
        </p>
      </div>
    </div>
  );
}

