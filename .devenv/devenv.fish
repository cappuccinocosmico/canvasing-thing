# devenv fish init

# Restore devenv PATH after user config may have modified it.
# _DEVENV_PATH is a colon-separated string from bash; split into fish list.
set -gx PATH (string split ":" -- $_DEVENV_PATH)

# Wrap fish_prompt for devenv reload hooks and prompt prefix.
if functions -q fish_prompt
    functions -c fish_prompt __devenv_user_fish_prompt
    function fish_prompt
        __devenv_user_fish_prompt
        
    end
else
    function fish_prompt
        
        echo -n "(devenv) > "
    end
end

# Hot-reload hook

