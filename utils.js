// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/*
 *
 * GNOME Shell
 *
 * Copyright (C) 2010-2014 - GNOME Foundation
 *  Dan Winship <danw@gnome.org>
 *
 * This file is part of gnome-shell.
 *
 * gnome-shell is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
 
 // I modified trySpawn and trySpawnCommandLine to accept an handler for the end of the spawned process.
 
// trySpawnSync:
// @argv: an argv arraye		
// @callback: callback to be called at the end of the execution
//
// Runs @argv in the foreground. If launching @argv fails,
// this will throw an error.

const GLib = imports.gi.GLib;

function trySpawn(argv, callback)
{
    var success, pid;
    try {
        [success, pid] = GLib.spawn_async(null, argv, null,
                                          GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                          null);
    } catch (err) {
        /* Rewrite the error in case of ENOENT */
        if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
            throw new GLib.SpawnError({ code: GLib.SpawnError.NOENT,
                                        message: _("Command not found") });
        } else if (err instanceof GLib.Error) {
            // The exception from gjs contains an error string like:
            //   Error invoking GLib.spawn_command_line_async: Failed to
            //   execute child process "foo" (No such file or directory)
            // We are only interested in the part in the parentheses. (And
            // we can't pattern match the text, since it gets localized.)
            let message = err.message.replace(/.*\((.+)\)/, '$1');
            throw new (err.constructor)({ code: err.code,
                                          message: message });
        } else {
            throw err;
        }
    }
    // Dummy child watch; we don't want to double-fork internally
    // because then we lose the parent-child relationship, which
    // can break polkit.  See https://bugzilla.redhat.com//show_bug.cgi?id=819275
    GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, callback);
}

// trySpawnCommandLine:
// @command_line: a command line
// @callback: callback to be called at the end of the execution
//
// Runs @command_line in the background. If launching @command_line
// fails, this will throw an error.
function trySpawnCommandLine(command_line, callback) {
    let success, argv;

    try {
        [success, argv] = GLib.shell_parse_argv(command_line);
    } catch (err) {
        // Replace "Error invoking GLib.shell_parse_argv: " with
        // something nicer
        err.message = err.message.replace(/[^:]*: /, _("Could not parse command:") + "\n");
        throw err;
    }

    trySpawn(argv, callback);
}

