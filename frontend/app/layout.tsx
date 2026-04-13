import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0, padding: 0,
        fontFamily: "'Source Sans 3', sans-serif",
        background: "#F7F4EF",
        minHeight: "100vh",
        color: "#1C1917",
      }}>
        <style>{`
          :root {
            --primary:       #1E3A5F;
            --primary-light: #2D5A8E;
            --accent:        #C8860A;
            --accent-light:  #F5D78A;
            --surface:       #FFFFFF;
            --surface-2:     #F7F4EF;
            --surface-3:     #EDE8DF;
            --text:          #1C1917;
            --text-2:        #44403C;
            --text-muted:    #78716C;
            --border:        #D6CFC4;
            --success:       #1A6B3C;
            --error:         #9B1C1C;
            --shadow:        0 2px 12px rgba(30,58,95,0.08);
          }
          * { box-sizing: border-box; }
          a { text-decoration: none; }
          button { cursor: pointer; }
          
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Nội dung các trang sẽ được render tại đây */}
        {children}
        
      </body>
    </html>
  );
}