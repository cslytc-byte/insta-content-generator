#!/usr/bin/env python3
"""
InstaCopy AI — Mobile Runner (Rock-Solid & Permission-Safe)
Finds any available port, avoids Windows socket permission errors, and displays a clean QR Code.
"""

import sys
import os
import socket
import http.server
import webbrowser

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def get_local_ip():
    """Find the best local IP address for the phone on the same Wi-Fi network."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def find_open_port(preferred_ports=(5000, 8000, 3000, 8888, 8080, 8081, 9000)):
    """Find an available port that does not trigger WinError 10013 or 10048."""
    for p in preferred_ports:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(('0.0.0.0', p))
            s.close()
            return p
        except (OSError, PermissionError):
            pass

    # Fallback: Let Windows OS allocate a guaranteed free port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('0.0.0.0', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def print_banner(local_ip, port):
    url = f"http://{local_ip}:{port}"
    localhost_url = f"http://localhost:{port}"

    print("\n" + "=" * 62)
    print("      📸  InstaCopy AI — Mobile Instagram Generator")
    print("=" * 62)
    print("\n>> Point your phone camera at this QR Code to open instantly:")
    print("-" * 62)

    try:
        import qrcode
        qr = qrcode.QRCode(box_size=1, border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
    except Exception as e:
        print(f"  [QR generator notice: {e}]")

    print("-" * 62)
    print(f">> 📱 Phone URL (Same Wi-Fi):  {url}")
    print(f">> 💻 Computer URL:            {localhost_url}")
    print("=" * 62)
    print("Tip: Keep this window open while using the app on your phone.")
    print("Press Ctrl+C at any time to stop.\n")

def run():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    if "--test" in sys.argv:
        print("Test mode: Assets check...")
        assert os.path.exists("index.html"), "index.html missing"
        assert os.path.exists("styles.css"), "styles.css missing"
        assert os.path.exists("app.js"), "app.js missing"
        print("Self-test passed!")
        return

    local_ip = get_local_ip()
    port = find_open_port()

    Handler = http.server.SimpleHTTPRequestHandler

    try:
        # Create server cleanly without SO_REUSEADDR conflict on Windows
        server = http.server.HTTPServer(('0.0.0.0', port), Handler)
        print_banner(local_ip, port)

        # Automatically open on desktop browser for convenience
        try:
            webbrowser.open(f"http://localhost:{port}")
        except Exception:
            pass

        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped successfully.")
    except Exception as e:
        print(f"\n[Error starting server]: {e}")
        # Secondary fallback with port 0
        try:
            print("Retrying with dynamic OS port...")
            server = http.server.HTTPServer(('0.0.0.0', 0), Handler)
            assigned_port = server.server_address[1]
            print_banner(local_ip, assigned_port)
            server.serve_forever()
        except Exception as e2:
            print(f"Failed to start server: {e2}")

if __name__ == "__main__":
    run()
