/* jshint esnext:true */
/*
 *
 *  GRUB reboot for GNOME Shell
 *  - Adds a "Reboot to..." button to the power-off dialog to select the OS to boot into
 *
 * Copyright (C) 2014 - 2015
 *     Patrizio Bruno <desertconsulting@gmail.com>
 *
 * This file is part of gnome-shell-extension-grubreboot.
 *
 * gnome-shell-extension-grubreboot is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell-extension-grubreboot is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const This = ExtensionUtils.getCurrentExtension();
const Utils = This.imports.utils;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
//const Util = imports.util;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Convenience = This.imports.convenience;
const Gettext = imports.gettext.domain(This.metadata['gettext-domain']);
const G_ = Gettext.gettext;

let backup;
let popupMenu;

function init() {
    Convenience.initTranslations();
}

function enable() {
    
    Main.EndSessionDialog.shutdownDialogContent.confirmButtons.push(
	{
	    signal: 'ConfirmedReboot'
        , label:  G_("Restart to...")
        , buttonType: 'menu'
        , action: function(button, dialog, signal) {
            if(popupMenu) {
                popupMenu.removeAll();
                Main.EndSessionDialog._endSessionDialog._group.remove_actor(popupMenu.actor);
                popupMenu.destroy();
            }
            let popup = new PopupMenu.PopupMenu(button, 0.0, St.Side.TOP, 0);
            popupMenu = popup;    
            Main.EndSessionDialog._endSessionDialog._group.add_actor(popup.actor);
            populatePopup(signal, dialog, popup);
            popup.toggle();
        }
    });

    backup = Main.EndSessionDialog._endSessionDialog._updateButtons;
    
    Main.EndSessionDialog._endSessionDialog._updateButtons = function() {
        let dialogContent = Main.EndSessionDialog.DialogContent[this._type];
        let buttons = [{ action: Lang.bind(this, this.cancel),
                         label:  _("Cancel"),
                         key:    Clutter.Escape }];

        for (let i = 0; i < dialogContent.confirmButtons.length; i++) {
            let signal = dialogContent.confirmButtons[i].signal;
            let label = dialogContent.confirmButtons[i].label;
            let buttonType = dialogContent.confirmButtons[i].buttonType;
            let actionFunc = dialogContent.confirmButtons[i].action;

	        if(typeof(buttonType) == 'undefined') {
	            buttons.push({ action: Lang.bind(this, function() {
    	                       this.close(true);
		                       let signalId = this.connect('closed',
	                                                   Lang.bind(this, function() {
		                                                       this.disconnect(signalId);
		                                                       this._confirm(signal);
	                                                   }));
			                   }),
			           label: label });
	        } else if(buttonType == 'menu'){
	            let dialog = this;
	            buttons.push({ action: function(button) {
                	                actionFunc(button, dialog, signal);
			                   },
			           label: label });
	        }
        }

        this.setButtons(buttons);
    };
}

function populatePopup(signal, dialog, popup) {

    let file = getFile();
    let stream = Gio.DataInputStream.new(file.read(null));
    let line;
    let rx = /^menuentry '([^']+)/;
    let count = 0;
    while (line = stream.read_line (null)) {
        if(count++ > 600) break;
        let res = rx.exec(line);
        if(res && res.length) {
            addPopupItem(signal, dialog, popup, res[1]);
        }
    }
    stream.close(null);
}

function getFile() {
    let file;
    ["/boot/grub/grub.cfg", "/boot/efi/EFI/grub.cfg"].every(function(path) {
        let f = Gio.file_new_for_path(path);
        if(f.query_exists(null)) {
            file = f;
        } else {
            return true;
        }
    });
    return file;
}

function addPopupItem(signal, dialog, popup, item) {
    popup.addAction(item, function() {
        Utils.trySpawnCommandLine("/usr/bin/pkexec --user root /usr/sbin/grub-reboot '" + item + "'", function(pid, status, data) {
            if(status === 0) {
                let signalId = dialog.connect('closed',
                                                       Lang.bind(dialog, function() {
                                                               this.disconnect(signalId);
                                                               this._confirm(signal);
                                                       }));
                dialog.close();
            }
        });
    });
}

function disable() {
	Main.EndSessionDialog.shutdownDialogContent.confirmButtons.pop();
	Main.EndSessionDialog._endSessionDialog._updateButtons = backup;
	if(popupMenu) {
        Main.EndSessionDialog._endSessionDialog._group.remove_actor(popupMenu.actor);
        popupMenu.destroy();
        popupMenu = null;
    }
}

