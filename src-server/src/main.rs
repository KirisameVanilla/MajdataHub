fn main() {
    if let Err(err) = majdata_hub_lib::run() {
        eprintln!("Majdata Hub failed to start: {err}");
    }
}
