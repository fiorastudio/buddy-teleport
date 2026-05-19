#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PopupVisibility {
    Hidden,
    Visible,
}

pub fn toggle_popup(current: PopupVisibility) -> PopupVisibility {
    match current {
        PopupVisibility::Hidden => PopupVisibility::Visible,
        PopupVisibility::Visible => PopupVisibility::Hidden,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn popup_visibility_toggles() {
        assert_eq!(toggle_popup(PopupVisibility::Hidden), PopupVisibility::Visible);
        assert_eq!(toggle_popup(PopupVisibility::Visible), PopupVisibility::Hidden);
    }
}
