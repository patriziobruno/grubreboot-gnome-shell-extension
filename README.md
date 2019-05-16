# grubreboot-gnome-shell-extension
gnome-shell extension to add a "Reboot" button to the end-session-dialog, so to run [grub-reboot](https://www.commandlinux.com/man-page/man8/grub-reboot.8.html) before restarting the system, in order to reboot your computer to the selected operating system.

This extension needs permissions for gnome-shell to read your grub.cfg file, please verify your Linux distribution documentation.

This extension is a GUI for the utility [grub-reboot](https://www.commandlinux.com/man-page/man8/grub-reboot.8.html). You may want to set your grub configuration properly before using the extension, [this stackexchange](https://unix.stackexchange.com/questions/43196/how-can-i-tell-grub-i-want-to-reboot-into-windows-before-i-reboot) might prove useful. The standard Ubuntu configuration should work just fine though.

When you select the operating system to reboot into, you'll be required to input your password.
